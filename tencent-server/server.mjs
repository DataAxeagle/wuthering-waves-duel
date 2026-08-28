import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { WebSocketServer } from "ws";
import { gameCore, asDeck, runCommand } from "./game-engine.mjs";
import { projectState, sanitizeEvent } from "../supabase/functions/_shared/pvp-state.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 8787);
const mobileRoot = path.resolve(process.env.MOBILE_ROOT || path.join(here, "../mobile"));
const dataDir = path.resolve(process.env.DATA_DIR || path.join(here, "data"));
const publicOrigin = String(process.env.PUBLIC_ORIGIN || "").replace(/\/$/, "");
const configuredSecret = process.env.PVP_SESSION_SECRET || "";
if (!configuredSecret && !["127.0.0.1", "localhost", "::1"].includes(host)) {
  throw new Error("PVP_SESSION_SECRET is required when listening outside localhost");
}
const sessionSecret = configuredSecret || crypto.randomBytes(48).toString("base64url");
if (!configuredSecret) console.warn("[waves-duel] using an ephemeral local session secret");

await fsp.mkdir(dataDir, { recursive:true });
const db = new DatabaseSync(path.join(dataDir, "pvp.sqlite"));
db.exec(`
  PRAGMA journal_mode=WAL;
  PRAGMA foreign_keys=ON;
  PRAGMA busy_timeout=5000;
  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    room_code TEXT NOT NULL UNIQUE,
    invite_hash TEXT NOT NULL,
    host_user_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting',
    winner_seat INTEGER,
    result_reason TEXT,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS members (
    room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    seat INTEGER NOT NULL,
    display_name TEXT NOT NULL,
    avatar_id TEXT NOT NULL DEFAULT '',
    deck_name TEXT,
    ready INTEGER NOT NULL DEFAULT 0,
    last_seen_at TEXT NOT NULL,
    resume_hash TEXT NOT NULL,
    PRIMARY KEY (room_id, user_id),
    UNIQUE (room_id, seat),
    UNIQUE (room_id, resume_hash)
  );
  CREATE TABLE IF NOT EXISTS decks (
    room_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    deck_json TEXT NOT NULL,
    PRIMARY KEY (room_id, user_id),
    FOREIGN KEY (room_id, user_id) REFERENCES members(room_id, user_id) ON DELETE CASCADE ON UPDATE CASCADE
  );
  CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL UNIQUE REFERENCES rooms(id) ON DELETE CASCADE,
    ruleset_version TEXT NOT NULL,
    state_json TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS receipts (
    match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    action_id TEXT NOT NULL,
    version INTEGER NOT NULL,
    result_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (match_id, user_id, action_id),
    UNIQUE (match_id, version)
  );
  CREATE TABLE IF NOT EXISTS views (
    room_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    view_json TEXT NOT NULL DEFAULT '{}',
    event_json TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT NOT NULL,
    PRIMARY KEY (room_id, user_id),
    FOREIGN KEY (room_id, user_id) REFERENCES members(room_id, user_id) ON DELETE CASCADE ON UPDATE CASCADE
  );
  CREATE INDEX IF NOT EXISTS members_user_active ON members(user_id);
  CREATE INDEX IF NOT EXISTS receipts_match_version ON receipts(match_id, version);
`);

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const roomSockets = new Map();
const rateWindows = new Map();

function nowIso() { return new Date().toISOString(); }
function futureIso(ms) { return new Date(Date.now() + ms).toISOString(); }
function randomToken(bytes = 24) { return crypto.randomBytes(bytes).toString("base64url"); }
function randomCode() { return Array.from(crypto.randomBytes(6), (value) => ALPHABET[value % ALPHABET.length]).join(""); }
function digest(value) { return crypto.createHash("sha256").update(String(value || "")).digest("hex"); }
function cleanName(value) { return String(value || "").trim().replace(/\s+/g, " ").slice(0, 16); }
function parseJson(value, fallback = null) { try { return JSON.parse(value); } catch { return fallback; } }
function receiptEvent(value) { return value?.format === "pvp-receipt-v2" ? value.event : value; }
function receiptSnapshot(value) { return value?.format === "pvp-receipt-v2" && value.snapshot?.players ? value.snapshot : null; }

function transaction(callback) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = callback();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function signSession(userId) {
  const payload = Buffer.from(JSON.stringify({ sub:userId, exp:Math.floor(Date.now() / 1000) + 30 * 86400 })).toString("base64url");
  const signature = crypto.createHmac("sha256", sessionSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifySession(token) {
  const [payload, signature] = String(token || "").split(".");
  if (!payload || !signature) return null;
  const expected = crypto.createHmac("sha256", sessionSecret).update(payload).digest();
  let actual;
  try { actual = Buffer.from(signature, "base64url"); } catch { return null; }
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return null;
  const decoded = parseJson(Buffer.from(payload, "base64url").toString("utf8"));
  if (!decoded?.sub || Number(decoded.exp || 0) <= Date.now() / 1000) return null;
  return { userId:String(decoded.sub), expiresAt:Number(decoded.exp) };
}

function allowRate(key, limit, intervalMs) {
  const current = Date.now();
  const entry = rateWindows.get(key);
  if (!entry || current - entry.startedAt >= intervalMs) {
    rateWindows.set(key, { startedAt:current, count:1 });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}

function publicRoom(room) {
  return room && {
    id:room.id,
    room_code:room.room_code,
    status:room.status,
    winner_seat:room.winner_seat,
    result_reason:room.result_reason,
    expires_at:room.expires_at,
  };
}

function listMembers(roomId) {
  return db.prepare("SELECT seat, display_name, avatar_id, deck_name, ready, last_seen_at, user_id, resume_hash FROM members WHERE room_id=? ORDER BY seat").all(roomId)
    .map((member) => ({ ...member, ready:Boolean(member.ready) }));
}

function memberFor(roomId, userId) {
  return db.prepare("SELECT * FROM members WHERE room_id=? AND user_id=?").get(roomId, userId);
}

function viewFor(roomId, userId) {
  const row = db.prepare("SELECT * FROM views WHERE room_id=? AND user_id=?").get(roomId, userId);
  return row && { ...row, view:parseJson(row.view_json, {}), event:parseJson(row.event_json, {}) };
}

function broadcast(roomId, type = "changed") {
  const sockets = roomSockets.get(roomId);
  if (!sockets) return;
  const payload = JSON.stringify({ type, roomId, at:nowIso() });
  for (const socket of [...sockets]) {
    if (socket.readyState === socket.OPEN) socket.send(payload);
    else sockets.delete(socket);
  }
  if (!sockets.size) roomSockets.delete(roomId);
}

function notifyRoom(roomId, type) {
  const now = nowIso();
  db.prepare("UPDATE views SET event_json=?, updated_at=? WHERE room_id=?").run(JSON.stringify({ type, at:now }), now, roomId);
  broadcast(roomId);
}

function requireMember(roomId, userId) {
  const member = memberFor(roomId, userId);
  if (!member) throw new Error("not_room_member");
  return member;
}

function finishRoom(roomId, actor, reason) {
  const room = db.prepare("SELECT * FROM rooms WHERE id=?").get(roomId);
  if (!room) throw new Error("room_not_found");
  if (["ended", "abandoned"].includes(room.status)) throw new Error("room_ended");
  const members = listMembers(roomId);
  const opponent = members.find((item) => Number(item.seat) !== Number(actor.seat));
  if (reason === "claim-timeout") {
    if (!opponent || Date.now() - new Date(opponent.last_seen_at).getTime() < 5 * 60_000) throw new Error("disconnect_grace_active");
  }
  const winnerSeat = reason === "claim-timeout" ? Number(actor.seat) : opponent ? Number(opponent.seat) : null;
  const now = nowIso();
  transaction(() => {
    db.prepare("UPDATE rooms SET status='ended', winner_seat=?, result_reason=?, updated_at=? WHERE id=?").run(winnerSeat, reason, now, roomId);
    db.prepare("UPDATE matches SET status='ended', updated_at=? WHERE room_id=?").run(now, roomId);
    db.prepare("UPDATE views SET event_json=?, updated_at=? WHERE room_id=?").run(JSON.stringify({ type:"room_ended", reason, winnerSeat, at:now }), now, roomId);
  });
  broadcast(roomId);
  return winnerSeat;
}

function startMatch(roomId) {
  const existing = db.prepare("SELECT id FROM matches WHERE room_id=?").get(roomId);
  if (existing) return false;
  const members = listMembers(roomId);
  if (members.length !== 2 || !members.every((member) => member.ready)) return false;
  const deckRows = db.prepare("SELECT user_id, deck_json FROM decks WHERE room_id=?").all(roomId);
  const decks = new Map(deckRows.map((row) => [row.user_id, parseJson(row.deck_json)]));
  if (!members.every((member) => decks.has(member.user_id))) throw new Error("deck_submission_missing");
  const seed = crypto.randomBytes(4).readUInt32BE(0);
  const game = new gameCore.DuelGame({
    seed,
    multiplayer:true,
    playerName:members[0].display_name,
    aiName:members[1].display_name,
    playerPresetData:decks.get(members[0].user_id),
    aiPresetData:decks.get(members[1].user_id),
  });
  const snapshot = game.snapshot();
  const now = nowIso();
  transaction(() => {
    db.prepare("INSERT INTO matches(id,room_id,ruleset_version,state_json,version,status,created_at,updated_at) VALUES(?,?,?,?,0,'active',?,?)")
      .run(crypto.randomUUID(), roomId, gameCore.RULESET_VERSION, JSON.stringify(snapshot), now, now);
    for (const member of members) {
      db.prepare("UPDATE views SET version=0, view_json=?, event_json=?, updated_at=? WHERE room_id=? AND user_id=?")
        .run(JSON.stringify(projectState(snapshot, Number(member.seat))), JSON.stringify({ type:"match_started", at:now }), now, roomId, member.user_id);
    }
    db.prepare("UPDATE rooms SET status='in_game', updated_at=?, expires_at=? WHERE id=? AND status='waiting'").run(now, futureIso(24 * 60 * 60_000), roomId);
  });
  broadcast(roomId);
  return true;
}

function handleCreate(userId, body) {
  const displayName = cleanName(body.displayName);
  if (!displayName) throw new Error("display_name_required");
  const existing = db.prepare("SELECT r.* FROM rooms r JOIN members m ON m.room_id=r.id WHERE m.user_id=? AND r.status IN ('waiting','in_game')").all(userId);
  for (const room of existing) {
    const count = Number(db.prepare("SELECT COUNT(*) AS count FROM members WHERE room_id=?").get(room.id).count);
    if (room.status === "waiting" && room.host_user_id === userId && count <= 1) db.prepare("DELETE FROM rooms WHERE id=?").run(room.id);
  }
  const active = db.prepare("SELECT COUNT(*) AS count FROM rooms r JOIN members m ON m.room_id=r.id WHERE m.user_id=? AND r.status IN ('waiting','in_game')").get(userId);
  if (Number(active.count) > 0) throw new Error("already_in_room");
  const roomId = crypto.randomUUID();
  const inviteToken = randomToken();
  const resumeToken = randomToken();
  const now = nowIso();
  let code = "";
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = randomCode();
    if (!db.prepare("SELECT 1 FROM rooms WHERE room_code=?").get(candidate)) { code = candidate; break; }
  }
  if (!code) throw new Error("room_code_exhausted");
  transaction(() => {
    db.prepare("INSERT INTO rooms(id,room_code,invite_hash,host_user_id,status,expires_at,created_at,updated_at) VALUES(?,?,?,?, 'waiting',?,?,?)")
      .run(roomId, code, digest(inviteToken), userId, futureIso(30 * 60_000), now, now);
    db.prepare("INSERT INTO members(room_id,user_id,seat,display_name,avatar_id,last_seen_at,resume_hash) VALUES(?,?,?,?,?,?,?)")
      .run(roomId, userId, 0, displayName, String(body.avatarId || "").slice(0, 80), now, digest(resumeToken));
    db.prepare("INSERT INTO views(room_id,user_id,version,view_json,event_json,updated_at) VALUES(?,?,0,'{}',?,?)")
      .run(roomId, userId, JSON.stringify({ type:"room_created", at:now }), now);
  });
  return { room:{ id:roomId, code, status:"waiting", expiresAt:futureIso(30 * 60_000) }, inviteToken, resumeToken, seat:0 };
}

function handleJoin(userId, body) {
  const roomCode = String(body.roomCode || "").trim().toUpperCase();
  const displayName = cleanName(body.displayName);
  if (!displayName || !/^[A-HJ-NP-Z2-9]{6}$/.test(roomCode)) throw new Error("invalid_join_request");
  const active = db.prepare("SELECT COUNT(*) AS count FROM rooms r JOIN members m ON m.room_id=r.id WHERE m.user_id=? AND r.status IN ('waiting','in_game')").get(userId);
  if (Number(active.count) > 0) throw new Error("already_in_room");
  const room = db.prepare("SELECT * FROM rooms WHERE room_code=? AND status='waiting' AND expires_at>?").get(roomCode, nowIso());
  if (!room) throw new Error("room_not_found");
  if (body.inviteToken && digest(body.inviteToken) !== room.invite_hash) throw new Error("invalid_invite");
  const count = Number(db.prepare("SELECT COUNT(*) AS count FROM members WHERE room_id=?").get(room.id).count);
  if (count >= 2) throw new Error("room_full");
  const resumeToken = randomToken();
  const now = nowIso();
  transaction(() => {
    db.prepare("INSERT INTO members(room_id,user_id,seat,display_name,avatar_id,last_seen_at,resume_hash) VALUES(?,?,?,?,?,?,?)")
      .run(room.id, userId, 1, displayName, String(body.avatarId || "").slice(0, 80), now, digest(resumeToken));
    db.prepare("INSERT INTO views(room_id,user_id,version,view_json,event_json,updated_at) VALUES(?,?,0,'{}',?,?)")
      .run(room.id, userId, JSON.stringify({ type:"joined", at:now }), now);
    db.prepare("UPDATE rooms SET updated_at=?, expires_at=? WHERE id=?").run(now, futureIso(30 * 60_000), room.id);
  });
  notifyRoom(room.id, "member_joined");
  return { room:{ id:room.id, code:room.room_code, status:room.status }, resumeToken, seat:1 };
}

function handleResume(userId, body) {
  const roomId = String(body.roomId || "");
  const room = db.prepare("SELECT * FROM rooms WHERE id=?").get(roomId);
  if (!room) throw new Error("room_not_found");
  const resumeHash = digest(body.resumeToken);
  const member = db.prepare("SELECT * FROM members WHERE room_id=? AND resume_hash=?").get(roomId, resumeHash);
  if (!member) throw new Error("invalid_resume_token");
  if (member.user_id !== userId) {
    transaction(() => {
      // 兼容迁移前未声明 ON UPDATE CASCADE 的本地测试数据库，事务结束时再检查外键。
      db.exec("PRAGMA defer_foreign_keys=ON");
      db.prepare("UPDATE members SET user_id=?, last_seen_at=? WHERE room_id=? AND user_id=?").run(userId, nowIso(), roomId, member.user_id);
      db.prepare("UPDATE views SET user_id=? WHERE room_id=? AND user_id=?").run(userId, roomId, member.user_id);
      db.prepare("UPDATE decks SET user_id=? WHERE room_id=? AND user_id=?").run(userId, roomId, member.user_id);
      if (room.host_user_id === member.user_id) db.prepare("UPDATE rooms SET host_user_id=? WHERE id=?").run(userId, roomId);
    });
  }
  notifyRoom(roomId, "member_resumed");
  return { seat:Number(member.seat), displayName:member.display_name };
}

function handleState(userId, body) {
  const roomId = String(body.roomId || "");
  const member = requireMember(roomId, userId);
  const room = db.prepare("SELECT * FROM rooms WHERE id=?").get(roomId);
  if (!room) throw new Error("room_not_found");
  const view = viewFor(roomId, userId);
  const members = listMembers(roomId).map(({ user_id, resume_hash, ...item }) => item);
  const sinceVersion = Number(body.sinceVersion);
  const events = [];
  let hasMore = false;
  if (["in_game", "ended"].includes(room.status) && Number.isSafeInteger(sinceVersion) && sinceVersion >= 0) {
    const match = db.prepare("SELECT id FROM matches WHERE room_id=?").get(roomId);
    if (match) {
      const receipts = db.prepare("SELECT version,result_json FROM receipts WHERE match_id=? AND version>? ORDER BY version LIMIT 101").all(match.id, sinceVersion);
      hasMore = receipts.length > 100;
      for (const receipt of receipts.slice(0, 100)) {
        const stored = parseJson(receipt.result_json, {});
        const snapshot = receiptSnapshot(stored);
        events.push({
          version:Number(receipt.version),
          event:sanitizeEvent(receiptEvent(stored), Number(member.seat)),
          view:snapshot ? projectState(snapshot, Number(member.seat)) : null,
        });
      }
    }
  }
  return { room:publicRoom(room), members, seat:Number(member.seat), view, events, hasMore };
}

function handleHeartbeat(userId, body) {
  const roomId = String(body.roomId || "");
  requireMember(roomId, userId);
  const now = nowIso();
  db.prepare("UPDATE members SET last_seen_at=? WHERE room_id=? AND user_id=?").run(now, roomId, userId);
  db.prepare("UPDATE rooms SET updated_at=?, expires_at=CASE WHEN status='waiting' THEN ? ELSE expires_at END WHERE id=?").run(now, futureIso(30 * 60_000), roomId);
  notifyRoom(roomId, "presence_changed");
  return { serverTime:now };
}

function handleLeave(userId, body) {
  const roomId = String(body.roomId || "");
  const member = memberFor(roomId, userId);
  if (!member) return { left:true, terminal:"room_not_found" };
  const room = db.prepare("SELECT * FROM rooms WHERE id=?").get(roomId);
  if (!room || ["ended", "abandoned"].includes(room.status)) return { left:true, terminal:"room_ended" };
  if (room.status === "in_game") return { left:true, winnerSeat:finishRoom(roomId, member, "forfeit") };
  const count = Number(db.prepare("SELECT COUNT(*) AS count FROM members WHERE room_id=?").get(roomId).count);
  if (room.host_user_id === userId || count <= 1) db.prepare("DELETE FROM rooms WHERE id=? AND status='waiting'").run(roomId);
  else {
    transaction(() => {
      db.prepare("DELETE FROM members WHERE room_id=? AND user_id=?").run(roomId, userId);
      db.prepare("UPDATE members SET ready=0 WHERE room_id=?").run(roomId);
    });
    notifyRoom(roomId, "member_left");
  }
  broadcast(roomId);
  return { left:true };
}

function handleReady(userId, body) {
  const roomId = String(body.roomId || "");
  requireMember(roomId, userId);
  const room = db.prepare("SELECT * FROM rooms WHERE id=?").get(roomId);
  if (!room || room.status !== "waiting") throw new Error("room_not_waiting");
  if (String(body.rulesetVersion || "") !== gameCore.RULESET_VERSION) throw new Error("ruleset_mismatch");
  const deck = asDeck(body.deck);
  const ready = Boolean(body.ready);
  const now = nowIso();
  transaction(() => {
    db.prepare("INSERT INTO decks(room_id,user_id,deck_json) VALUES(?,?,?) ON CONFLICT(room_id,user_id) DO UPDATE SET deck_json=excluded.deck_json")
      .run(roomId, userId, JSON.stringify(deck));
    db.prepare("UPDATE members SET ready=?, deck_name=?, last_seen_at=? WHERE room_id=? AND user_id=?")
      .run(ready ? 1 : 0, deck.name, now, roomId, userId);
  });
  if (!startMatch(roomId)) notifyRoom(roomId, "ready_changed");
  return {};
}

function handleCommand(userId, body) {
  const roomId = String(body.roomId || "");
  const member = requireMember(roomId, userId);
  const actionId = String(body.actionId || "");
  if (!/^[0-9a-f-]{36}$/i.test(actionId)) throw new Error("invalid_action_id");
  const match = db.prepare("SELECT * FROM matches WHERE room_id=?").get(roomId);
  if (!match) throw new Error("match_not_found");
  if (match.status !== "active") throw new Error("match_ended");
  const duplicate = db.prepare("SELECT version,result_json FROM receipts WHERE match_id=? AND user_id=? AND action_id=?").get(match.id, userId, actionId);
  if (duplicate) {
    const stored = parseJson(duplicate.result_json, {});
    return { version:Number(duplicate.version), duplicate:true, result:sanitizeEvent(receiptEvent(stored), Number(member.seat)), view:viewFor(roomId, userId)?.view || null };
  }
  const expectedVersion = Number(body.expectedVersion);
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion !== Number(match.version)) throw new Error("stale_version");
  if (String(match.ruleset_version) !== gameCore.RULESET_VERSION) throw new Error("ruleset_mismatch");
  const game = new gameCore.DuelGame({ seed:1, multiplayer:true });
  const loaded = game.loadSnapshot(parseJson(match.state_json));
  if (!loaded?.ok) throw new Error("invalid_match_state");
  const result = runCommand(game, Number(member.seat), String(body.type || ""), body.payload || {});
  const snapshot = game.snapshot();
  const receiptPayload = { format:"pvp-receipt-v2", event:result, snapshot };
  const members = listMembers(roomId);
  const newVersion = expectedVersion + 1;
  const now = nowIso();
  transaction(() => {
    const updated = db.prepare("UPDATE matches SET state_json=?, version=?, updated_at=?, status=? WHERE id=? AND version=? AND status='active'")
      .run(JSON.stringify(snapshot), newVersion, now, game.winner == null ? "active" : "ended", match.id, expectedVersion);
    if (Number(updated.changes) !== 1) throw new Error("stale_version");
    db.prepare("INSERT INTO receipts(match_id,user_id,action_id,version,result_json,created_at) VALUES(?,?,?,?,?,?)")
      .run(match.id, userId, actionId, newVersion, JSON.stringify(receiptPayload), now);
    for (const item of members) {
      db.prepare("UPDATE views SET version=?, view_json=?, event_json=?, updated_at=? WHERE room_id=? AND user_id=?")
        .run(newVersion, JSON.stringify(projectState(snapshot, Number(item.seat))), JSON.stringify(sanitizeEvent(result, Number(item.seat))), now, roomId, item.user_id);
    }
    if (game.winner != null) {
      db.prepare("UPDATE rooms SET status='ended', winner_seat=?, result_reason='game', updated_at=? WHERE id=?")
        .run(Number(game.winner), now, roomId);
    }
  });
  broadcast(roomId);
  return { version:newVersion, duplicate:false, result:sanitizeEvent(result, Number(member.seat)), view:projectState(snapshot, Number(member.seat)) };
}

function handleTerminal(userId, operation, body) {
  const roomId = String(body.roomId || "");
  const member = requireMember(roomId, userId);
  return { winnerSeat:finishRoom(roomId, member, operation) };
}

function executeOperation(userId, operation, body) {
  switch (operation) {
    case "create": return handleCreate(userId, body);
    case "join": return handleJoin(userId, body);
    case "resume": return handleResume(userId, body);
    case "state": return handleState(userId, body);
    case "heartbeat": return handleHeartbeat(userId, body);
    case "leave": return handleLeave(userId, body);
    case "ready": return handleReady(userId, body);
    case "command": return handleCommand(userId, body);
    case "forfeit":
    case "claim-timeout": return handleTerminal(userId, operation, body);
    default: throw new Error("unknown_operation");
  }
}

function corsHeaders(request) {
  const origin = String(request.headers.origin || "");
  const allowed = !origin || origin === "null" || origin === publicOrigin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
  return allowed && origin ? { "access-control-allow-origin":origin, vary:"Origin" } : {};
}

function jsonReply(request, response, payload, status = 200) {
  response.writeHead(status, {
    ...corsHeaders(request),
    "content-type":"application/json; charset=utf-8",
    "cache-control":"no-store",
    "x-content-type-options":"nosniff",
  });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 2 * 1024 * 1024) throw new Error("payload_too_large");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return parseJson(Buffer.concat(chunks).toString("utf8"), {});
}

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"], [".js", "text/javascript; charset=utf-8"], [".mjs", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"], [".json", "application/json; charset=utf-8"], [".png", "image/png"],
  [".jpg", "image/jpeg"], [".jpeg", "image/jpeg"], [".webp", "image/webp"], [".svg", "image/svg+xml"],
  [".mp4", "video/mp4"], [".woff2", "font/woff2"], [".woff", "font/woff"], [".ttf", "font/ttf"], [".ico", "image/x-icon"],
]);

async function serveStatic(request, response, url) {
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { return false; }
  if (pathname === "/") pathname = "/index.html";
  if (pathname === "/pvp") pathname = "/pvp.html";
  const target = path.resolve(mobileRoot, `.${pathname}`);
  if (target !== mobileRoot && !target.startsWith(`${mobileRoot}${path.sep}`)) return false;
  let stat;
  try { stat = await fsp.stat(target); } catch { return false; }
  if (!stat.isFile()) return false;
  const extension = path.extname(target).toLowerCase();
  const headers = {
    "content-type":mimeTypes.get(extension) || "application/octet-stream",
    "accept-ranges":"bytes",
    "x-content-type-options":"nosniff",
    "referrer-policy":"strict-origin-when-cross-origin",
    "cache-control":extension === ".html" ? "no-cache" : "public, max-age=604800",
  };
  const range = String(request.headers.range || "").match(/^bytes=(\d*)-(\d*)$/);
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), stat.size - 1) : stat.size - 1;
    if (start > end || start >= stat.size) {
      response.writeHead(416, { "content-range":`bytes */${stat.size}` }); response.end(); return true;
    }
    response.writeHead(206, { ...headers, "content-range":`bytes ${start}-${end}/${stat.size}`, "content-length":end - start + 1 });
    if (request.method === "HEAD") response.end(); else fs.createReadStream(target, { start, end }).pipe(response);
    return true;
  }
  response.writeHead(200, { ...headers, "content-length":stat.size });
  if (request.method === "HEAD") response.end(); else fs.createReadStream(target).pipe(response);
  return true;
}

const server = http.createServer(async (request, response) => {
  const requestId = crypto.randomUUID();
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  try {
    if (request.method === "OPTIONS") {
      response.writeHead(204, { ...corsHeaders(request), "access-control-allow-headers":"authorization, apikey, content-type", "access-control-allow-methods":"POST, OPTIONS" });
      return response.end();
    }
    if (request.method === "GET" && url.pathname === "/api/status") {
      return jsonReply(request, response, { ok:true, service:"waves-duel-tencent", rulesetVersion:gameCore.RULESET_VERSION, serverTime:nowIso() });
    }
    if (request.method === "POST" && url.pathname === "/api/pvp/session") {
      const remote = request.socket.remoteAddress || "unknown";
      if (!allowRate(`session:${remote}`, 30, 60_000)) return jsonReply(request, response, { ok:false, requestId, error:"rate_limited" }, 429);
      const userId = crypto.randomUUID();
      const expiresAt = Math.floor(Date.now() / 1000) + 30 * 86400;
      return jsonReply(request, response, { ok:true, requestId, access_token:signSession(userId), expires_at:expiresAt, user:{ id:userId } });
    }
    const operationMatch = url.pathname.match(/^\/functions\/v1\/pvp\/([a-z-]+)$/);
    if (request.method === "POST" && operationMatch) {
      const token = String(request.headers.authorization || "").replace(/^Bearer\s+/i, "");
      const session = verifySession(token);
      if (!session) return jsonReply(request, response, { ok:false, requestId, error:"unauthorized" }, 401);
      if (!allowRate(`user:${session.userId}`, 180, 10_000)) return jsonReply(request, response, { ok:false, requestId, error:"rate_limited" }, 429);
      const body = await readBody(request);
      const result = executeOperation(session.userId, operationMatch[1], body);
      return jsonReply(request, response, { ok:true, requestId, serverTime:nowIso(), ...result });
    }
    if (["GET", "HEAD"].includes(request.method || "") && await serveStatic(request, response, url)) return;
    jsonReply(request, response, { ok:false, requestId, error:"not_found" }, 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : "internal_error";
    const status = ["room_not_found", "match_not_found"].includes(message) ? 404
      : ["unauthorized", "not_room_member"].includes(message) ? 401
      : ["stale_version", "match_ended", "room_ended", "room_not_waiting", "ruleset_mismatch"].includes(message) ? 409
      : message === "rate_limited" ? 429 : 400;
    console.error(`[${requestId}]`, message);
    jsonReply(request, response, { ok:false, requestId, error:message }, status);
  }
});

const wss = new WebSocketServer({ noServer:true });
server.on("upgrade", (request, socket, head) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    if (url.pathname !== "/ws") return socket.destroy();
    const session = verifySession(url.searchParams.get("token"));
    const roomId = String(url.searchParams.get("roomId") || "");
    if (!session || !memberFor(roomId, session.userId)) return socket.destroy();
    wss.handleUpgrade(request, socket, head, (websocket) => {
      websocket.roomId = roomId;
      websocket.userId = session.userId;
      websocket.alive = true;
      const sockets = roomSockets.get(roomId) || new Set();
      sockets.add(websocket);
      roomSockets.set(roomId, sockets);
      websocket.on("pong", () => { websocket.alive = true; });
      websocket.on("close", () => { sockets.delete(websocket); if (!sockets.size) roomSockets.delete(roomId); });
      websocket.send(JSON.stringify({ type:"connected", roomId, at:nowIso() }));
    });
  } catch { socket.destroy(); }
});

const pingTimer = setInterval(() => {
  for (const socket of wss.clients) {
    if (!socket.alive) socket.terminate();
    else { socket.alive = false; socket.ping(); }
  }
}, 30_000);
pingTimer.unref();

const cleanupTimer = setInterval(() => {
  const now = nowIso();
  const expired = db.prepare("SELECT id FROM rooms WHERE (status='waiting' AND expires_at<?) OR (status IN ('ended','abandoned') AND updated_at<?)")
    .all(now, new Date(Date.now() - 2 * 60 * 60_000).toISOString());
  for (const room of expired) { db.prepare("DELETE FROM rooms WHERE id=?").run(room.id); broadcast(room.id, "room_closed"); }
  for (const [key, entry] of rateWindows) if (Date.now() - entry.startedAt > 5 * 60_000) rateWindows.delete(key);
}, 60_000);
cleanupTimer.unref();

server.listen(port, host, () => {
  console.log(`[waves-duel] listening on http://${host}:${port}`);
  console.log(`[waves-duel] mobile root: ${mobileRoot}`);
  console.log(`[waves-duel] sqlite: ${path.join(dataDir, "pvp.sqlite")}`);
});

function shutdown(signal) {
  console.log(`[waves-duel] ${signal}, shutting down`);
  clearInterval(pingTimer);
  clearInterval(cleanupTimer);
  for (const socket of wss.clients) socket.close(1001, "server_shutdown");
  server.close(() => { db.close(); process.exit(0); });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
