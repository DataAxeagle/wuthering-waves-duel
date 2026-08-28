import test from "node:test";
import assert from "node:assert/strict";
import { WebSocket } from "../tencent-server/node_modules/ws/wrapper.mjs";

await import("../mobile/card-library/catalog.js");
await import("../mobile/card-library/presets.js");
await import("../mobile/core.js");

const baseUrl = process.env.TENCENT_PVP_BASE_URL || "http://127.0.0.1:8787";
const presets = Object.values(globalThis.WavesDuelPresets.presets);

async function createIdentity() {
  const response = await fetch(`${baseUrl}/api/pvp/session`, { method:"POST", headers:{ "content-type":"application/json" }, body:"{}" });
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  return payload;
}

async function call(identity, operation, body = {}) {
  const response = await fetch(`${baseUrl}/functions/v1/pvp/${operation}`, {
    method:"POST",
    headers:{ "content-type":"application/json", authorization:`Bearer ${identity.access_token}` },
    body:JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) throw Object.assign(new Error(payload.error || `HTTP ${response.status}`), { response, payload });
  return payload;
}

function wsUrl(identity, roomId) {
  const url = new URL(baseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws";
  url.search = new URLSearchParams({ token:identity.access_token, roomId }).toString();
  return url.href;
}

function waitForMessage(socket, expectedType, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`WebSocket ${expectedType} timeout`)), timeout);
    const listener = (data) => {
      const payload = JSON.parse(String(data));
      if (payload.type !== expectedType) return;
      clearTimeout(timer);
      socket.off("message", listener);
      resolve(payload);
    };
    socket.on("message", listener);
  });
}

test("腾讯云同源后端完成双人房间、实时通知、开局、幂等动作和离开", async () => {
  const status = await fetch(`${baseUrl}/api/status`).then((response) => response.json());
  assert.equal(status.ok, true);
  assert.equal(status.rulesetVersion, globalThis.WavesDuelCore.RULESET_VERSION);

  const playerA = await createIdentity();
  const playerB = await createIdentity();
  const created = await call(playerA, "create", { displayName:"测试甲" });
  assert.match(created.room.code, /^[A-HJ-NP-Z2-9]{6}$/);

  const socket = new WebSocket(wsUrl(playerA, created.room.id));
  const connected = waitForMessage(socket, "connected", 10000);
  await new Promise((resolve, reject) => { socket.once("open", resolve); socket.once("error", reject); });
  await connected;
  const changed = waitForMessage(socket, "changed", 10000);
  const joined = await call(playerB, "join", { displayName:"测试乙", roomCode:created.room.code, inviteToken:created.inviteToken });
  assert.equal(joined.seat, 1);
  await changed;

  const firstState = await call(playerA, "state", { roomId:created.room.id });
  assert.equal(firstState.members.length, 2);
  assert.equal(firstState.room.status, "waiting");

  await call(playerA, "ready", { roomId:created.room.id, ready:true, rulesetVersion:globalThis.WavesDuelCore.RULESET_VERSION, deck:presets[0] });
  await call(playerB, "ready", { roomId:created.room.id, ready:true, rulesetVersion:globalThis.WavesDuelCore.RULESET_VERSION, deck:presets[1] });

  const stateA = await call(playerA, "state", { roomId:created.room.id, sinceVersion:0 });
  const stateB = await call(playerB, "state", { roomId:created.room.id, sinceVersion:0 });
  assert.equal(stateA.room.status, "in_game");
  assert.equal(stateB.room.status, "in_game");
  assert.equal(stateA.view.view.players.length, 2);
  assert.equal(stateB.view.view.players.length, 2);
  assert.equal(stateA.view.view.players[1].hand.every((card) => card.hidden), true);
  assert.equal(stateB.view.view.players[1].hand.every((card) => card.hidden), true);

  const winnerIsA = Number(stateA.view.view.coinWinner) === 0;
  const actor = winnerIsA ? playerA : playerB;
  const winnerSeat = winnerIsA ? 0 : 1;
  const actionId = crypto.randomUUID();
  const commandBody = { roomId:created.room.id, actionId, expectedVersion:0, type:"choose_initiative", payload:{ choice:winnerSeat } };
  const command = await call(actor, "command", commandBody);
  assert.equal(command.version, 1);
  assert.equal(command.duplicate, false);
  const duplicate = await call(actor, "command", commandBody);
  assert.equal(duplicate.version, 1);
  assert.equal(duplicate.duplicate, true);

  const eventState = await call(winnerIsA ? playerB : playerA, "state", { roomId:created.room.id, sinceVersion:0 });
  assert.equal(eventState.events.length, 1);
  assert.equal(eventState.events[0].version, 1);
  assert.equal(eventState.events[0].event.commandType, "choose_initiative");

  const left = await call(playerA, "leave", { roomId:created.room.id });
  assert.equal(left.left, true);
  const ended = await call(playerB, "state", { roomId:created.room.id });
  assert.equal(ended.room.status, "ended");
  socket.close();
});

test("腾讯云后端可用恢复令牌把席位安全转移到新匿名身份", async () => {
  const original = await createIdentity();
  const replacement = await createIdentity();
  const created = await call(original, "create", { displayName:"恢复测试" });
  const resumed = await call(replacement, "resume", { roomId:created.room.id, resumeToken:created.resumeToken });
  assert.equal(resumed.seat, 0);
  const state = await call(replacement, "state", { roomId:created.room.id });
  assert.equal(state.seat, 0);
  assert.equal(state.members[0].display_name, "恢复测试");
  await assert.rejects(() => call(original, "state", { roomId:created.room.id }), /not_room_member/);
  const left = await call(replacement, "leave", { roomId:created.room.id });
  assert.equal(left.left, true);
});
