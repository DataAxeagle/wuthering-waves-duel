import { createClient } from "npm:@supabase/supabase-js@2";
import { gameCore } from "../_shared/game-runtime.ts";
import { projectState, sanitizeEvent } from "../_shared/pvp-state.mjs";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const allowedOrigins = new Set([
  "https://wuthering-waves-duel-mobile.pages.dev",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);

function cors(request: Request) {
  const origin = request.headers.get("origin") || "";
  const pagesPreview = /^https:\/\/[a-z0-9-]+\.wuthering-waves-duel-mobile\.pages\.dev$/i.test(origin);
  return {
    "access-control-allow-origin": allowedOrigins.has(origin) || pagesPreview ? origin : "https://wuthering-waves-duel-mobile.pages.dev",
    "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
    "access-control-allow-methods": "POST, OPTIONS",
    "vary": "Origin",
  };
}
function reply(request: Request, payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { ...cors(request), "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}
function randomToken(bytes = 24) { const data = crypto.getRandomValues(new Uint8Array(bytes)); return btoa(String.fromCharCode(...data)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", ""); }
function randomCode() { const bytes = crypto.getRandomValues(new Uint8Array(6)); return Array.from(bytes, (value) => ALPHABET[value % ALPHABET.length]).join(""); }
async function digest(value: string) { const data = new TextEncoder().encode(value); return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", data)), (byte) => byte.toString(16).padStart(2, "0")).join(""); }
function cleanName(value: unknown) { return String(value || "").trim().replace(/\s+/g, " ").slice(0, 16); }
function asDeck(value: any) {
  const roleCards = Array.isArray(value?.roleCards) ? value.roleCards.map(String) : [];
  const actions = Array.isArray(value?.actions) ? value.actions.map((entry: any) => [String(entry?.[0] || ""), Number(entry?.[1])]) : Object.entries(value?.actions || {}).map(([id, count]) => [id, Number(count)]);
  const heroIds = Array.isArray(value?.heroIds) ? value.heroIds.map(String) : [];
  const deck = { id: String(value?.id || "pvp-custom").slice(0, 64), name: String(value?.name || "自组卡组").slice(0, 20), heroIds, roleCards, actions };
  gameCore.validatePresetConstruction(deck);
  return deck;
}

function commitQueuedDamage(game: any, result: any) {
  const events: any[] = [];
  if (result?.damageEvent) events.push(result.damageEvent);
  for (const effect of result?.effects || []) events.push(...(effect?.damageEvents || []));
  events.push(...(result?.effect?.damageEvents || []));
  for (const event of events) game.commitDamage(event);
}
function resolveDeferredEffect(game: any, seat: number, payload: any) {
  const effectId = String(payload?.effectId || "");
  const effect = (game.pendingDeferredEffects || []).find((item: any) => item?.effectId === effectId);
  if (!effect || Number(effect.playerIndex) !== seat) throw new Error("deferred_effect_not_owned");
  const choices = Array.isArray(payload?.choices) ? payload.choices : [];
  const pendingOperations = (effect.deferred || []).filter((operation: any) => !operation?.committed);
  const committed = game.resolveDeferredEffect(seat, effectId, choices);
  if (!committed?.ok) throw new Error(committed?.reason || "deferred_commit_failed");
  const operationMetadata = pendingOperations.map((operation: any) => ({
    operationId: operation.operationId,
    playerIndex: operation.playerIndex,
    type: operation.type,
    revealed: operation.type === "deck-top-to-hand",
  }));
  return {
    ok: true,
    effectId,
    effect: { effectId, playerIndex: effect.playerIndex, cardName: effect.cardName, text: effect.text, timing: effect.timing, note: effect.note },
    committed: (committed.committed || []).map((item: any, index: number) => ({ ...item, ...(operationMetadata[index] || { playerIndex: seat }) })),
  };
}
async function notifyRoom(service: any, roomId: string, type: string) {
  const { error } = await service.from("pvp_player_views").update({ event: { type, at: new Date().toISOString() }, updated_at: new Date().toISOString() }).eq("room_id", roomId);
  return !error;
}
function runCommand(game: any, seat: number, type: string, payload: any) {
  const commands: Record<string, () => any> = {
    choose_initiative: () => game.chooseInitiative(seat, Number(payload.choice)),
    mulligan: () => game.mulligan(seat, payload.uids || []),
    choose_leader: () => game.chooseLeader(seat, Number(payload.heroIndex)),
    confirm_setup: () => game.confirmSetup(seat),
    charge: () => game.charge(seat, String(payload.uid || "")),
    upgrade: () => game.upgrade(seat, Number(payload.heroIndex), String(payload.roleCardId || ""), payload.discardUids || []),
    switch_hero: () => game.switchHero(seat, Number(payload.heroIndex)),
    begin_contest: () => game.beginContest(seat, String(payload.uid || "")),
    respond_contest: () => game.respondContest(seat, payload.uid ? String(payload.uid) : null),
    resolve_payment: () => game.resolvePaymentChoice(seat, Boolean(payload.accept)),
    resolve_choice: () => game.resolveChoice(seat, payload.choice || {}),
    discard_effect: () => game.discardForEffect(seat, payload.uids || []),
    discard_hand_limit: () => game.discardForHandLimit(seat, payload.uids || []),
    play_combo: () => game.playCombo(seat, String(payload.uid || "")),
    resolve_deferred_effect: () => resolveDeferredEffect(game, seat, payload),
    end_pursuit: () => game.endPursuit(seat),
    end_turn: () => game.endTurn(seat),
  };
  if (!commands[type]) throw new Error("unsupported_command");
  const result = commands[type]();
  if (!result?.ok) throw new Error(result?.reason || "illegal_action");
  commitQueuedDamage(game, result);
  result.commandType = type;
  result.actorSeat = seat;
  return result;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(request) });
  const requestId = crypto.randomUUID();
  try {
    if (request.method !== "POST") return reply(request, { ok: false, requestId, error: "method_not_allowed" }, 405);
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const service = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data: authData, error: authError } = await service.auth.getUser(token);
    if (authError || !authData.user) return reply(request, { ok: false, requestId, error: "unauthorized" }, 401);
    const userId = authData.user.id;
    const operation = new URL(request.url).pathname.split("/").filter(Boolean).pop() || "";
    const body = await request.json().catch(() => ({}));

    if (operation === "create") {
      const displayName = cleanName(body.displayName);
      if (!displayName) throw new Error("display_name_required");
      const { data: memberships } = await service.from("pvp_room_members").select("room_id").eq("user_id", userId);
      const memberRoomIds = (memberships || []).map((item: any) => item.room_id);
      if (memberRoomIds.length) {
        const { count: activeCount } = await service.from("pvp_rooms").select("id", { count: "exact", head: true }).in("id", memberRoomIds).in("status", ["waiting", "in_game"]);
        if ((activeCount || 0) > 0) throw new Error("already_in_room");
      }
      const inviteToken = randomToken(), resumeToken = randomToken();
      let room: any = null;
      for (let attempt = 0; attempt < 6 && !room; attempt += 1) {
        const { data, error } = await service.from("pvp_rooms").insert({ room_code: randomCode(), invite_hash: await digest(inviteToken), host_user_id: userId }).select().single();
        if (!error) room = data; else if (error.code !== "23505") throw error;
      }
      if (!room) throw new Error("room_code_exhausted");
      const { error: memberError } = await service.from("pvp_room_members").insert({ room_id: room.id, user_id: userId, seat: 0, display_name: displayName, avatar_id: String(body.avatarId || "").slice(0, 80), resume_hash: await digest(resumeToken) });
      if (memberError) throw memberError;
      const { error: viewError } = await service.from("pvp_player_views").insert({ room_id: room.id, user_id: userId, version: 0, view: {}, event: { type: "room_created" } });
      if (viewError) throw viewError;
      return reply(request, { ok: true, requestId, serverTime: new Date().toISOString(), room: { id: room.id, code: room.room_code, status: room.status, expiresAt: room.expires_at }, inviteToken, resumeToken, seat: 0 });
    }

    if (operation === "join") {
      const roomCode = String(body.roomCode || "").trim().toUpperCase();
      const displayName = cleanName(body.displayName);
      if (!displayName || !/^[A-HJ-NP-Z2-9]{6}$/.test(roomCode)) throw new Error("invalid_join_request");
      const { data: room, error: roomError } = await service.from("pvp_rooms").select("*").eq("room_code", roomCode).eq("status", "waiting").gt("expires_at", new Date().toISOString()).single();
      if (roomError || !room) throw new Error("room_not_found");
      if (body.inviteToken && await digest(String(body.inviteToken)) !== room.invite_hash) throw new Error("invalid_invite");
      const { count } = await service.from("pvp_room_members").select("*", { count: "exact", head: true }).eq("room_id", room.id);
      if ((count || 0) >= 2) throw new Error("room_full");
      const resumeToken = randomToken();
      const { error } = await service.from("pvp_room_members").insert({ room_id: room.id, user_id: userId, seat: 1, display_name: displayName, avatar_id: String(body.avatarId || "").slice(0, 80), resume_hash: await digest(resumeToken) });
      if (error) throw error;
      const { error: guestViewError } = await service.from("pvp_player_views").insert({ room_id: room.id, user_id: userId, version: 0, view: {}, event: { type: "joined" } });
      if (guestViewError) throw guestViewError;
      await service.from("pvp_rooms").update({ updated_at: new Date().toISOString(), expires_at: new Date(Date.now() + 30 * 60_000).toISOString() }).eq("id", room.id);
      await notifyRoom(service, room.id, "member_joined");
      return reply(request, { ok: true, requestId, serverTime: new Date().toISOString(), room: { id: room.id, code: room.room_code, status: room.status }, resumeToken, seat: 1 });
    }

    const roomId = String(body.roomId || "");
    if (operation === "resume") {
      const resumeHash = await digest(String(body.resumeToken || ""));
      const { data, error } = await service.rpc("resume_pvp_seat", { p_room_id: roomId, p_resume_hash: resumeHash, p_new_user_id: userId }).single();
      if (error) throw new Error(error.message.includes("invalid_resume_token") ? "invalid_resume_token" : error.message);
      const resumed = data as { seat: number; display_name: string };
      await notifyRoom(service, roomId, "member_resumed");
      return reply(request, { ok: true, requestId, seat: resumed.seat, displayName: resumed.display_name });
    }
    const { data: member, error: memberError } = await service.from("pvp_room_members").select("*").eq("room_id", roomId).eq("user_id", userId).single();
    if (memberError || !member) return reply(request, { ok: false, requestId, error: "not_room_member" }, 403);

    if (operation === "heartbeat") {
      const now = new Date().toISOString();
      const { error } = await service.from("pvp_room_members").update({ last_seen_at: now }).eq("room_id", roomId).eq("user_id", userId);
      if (error) throw error;
      await service.from("pvp_rooms").update({ updated_at: now, expires_at: new Date(Date.now() + 30 * 60_000).toISOString() }).eq("id", roomId).eq("status", "waiting");
      await notifyRoom(service, roomId, "presence_changed");
      return reply(request, { ok: true, requestId, serverTime: new Date().toISOString() });
    }
    if (operation === "state") {
      const { data: view } = await service.from("pvp_player_views").select("*").eq("room_id", roomId).eq("user_id", userId).maybeSingle();
      const { data: room } = await service.from("pvp_rooms").select("id,room_code,status,winner_seat,result_reason,expires_at").eq("id", roomId).single();
      const { data: members } = await service.from("pvp_room_members").select("seat,display_name,avatar_id,deck_name,ready,last_seen_at").eq("room_id", roomId).order("seat");
      return reply(request, { ok: true, requestId, room, members, seat: member.seat, view });
    }
    if (operation === "ready") {
      const deck = asDeck(body.deck);
      if (String(body.rulesetVersion || "") !== gameCore.RULESET_VERSION) throw new Error("ruleset_mismatch");
      const { data: bothReadyData, error: setReadyError } = await service.rpc("set_pvp_ready", { p_room_id: roomId, p_user_id: userId, p_deck: deck, p_ruleset_version: gameCore.RULESET_VERSION, p_ready: Boolean(body.ready), p_deck_name: deck.name });
      if (setReadyError) throw new Error(setReadyError.message.includes("room_not_waiting") ? "room_not_waiting" : setReadyError.message);
      const bothReady = Boolean(bothReadyData);
      const { data: members, error: membersError } = await service.from("pvp_room_members").select("*").eq("room_id", roomId).order("seat");
      if (membersError) throw membersError;
      let started = false;
      if (body.ready && bothReady && members?.length === 2 && members.every((item: any) => item.ready)) {
        const { data: decks, error: decksError } = await service.from("pvp_deck_submissions").select("user_id,deck").eq("room_id", roomId);
        if (decksError) throw decksError;
        const byUser = new Map((decks || []).map((item: any) => [item.user_id, item.deck]));
        const seed = crypto.getRandomValues(new Uint32Array(1))[0];
        const game = new gameCore.DuelGame({ seed, multiplayer: true, playerName: members[0].display_name, aiName: members[1].display_name, playerPresetData: byUser.get(members[0].user_id), aiPresetData: byUser.get(members[1].user_id) });
        const snapshot = game.snapshot();
        const { data: startData, error: startError } = await service.rpc("start_pvp_match", { p_room_id: roomId, p_ruleset_version: gameCore.RULESET_VERSION, p_state: snapshot, p_view_zero: projectState(snapshot, 0), p_view_one: projectState(snapshot, 1), p_deck_zero: byUser.get(members[0].user_id), p_deck_one: byUser.get(members[1].user_id) }).single();
        if (startError) throw startError;
        started = Boolean((startData as { started: boolean }).started);
      }
      return reply(request, { ok: true, requestId });
    }
    if (operation === "command") {
      const actionId = String(body.actionId || "");
      if (!/^[0-9a-f-]{36}$/i.test(actionId)) throw new Error("invalid_action_id");
      const { data: match, error: matchError } = await service.from("pvp_matches").select("*").eq("room_id", roomId).single();
      if (matchError || !match) throw new Error("match_not_found");
      if (String(match.ruleset_version || "") !== gameCore.RULESET_VERSION || String(match.state?.rulesetVersion || "") !== gameCore.RULESET_VERSION) throw new Error("ruleset_mismatch");
      const expectedVersion = Number(body.expectedVersion);
      const { data: receipt } = await service.from("pvp_action_receipts").select("version,result").eq("match_id", match.id).eq("user_id", userId).eq("action_id", actionId).maybeSingle();
      if (receipt) {
        const { data: currentView } = await service.from("pvp_player_views").select("view").eq("room_id", roomId).eq("user_id", userId).single();
        return reply(request, { ok: true, requestId, version: receipt.version, duplicate: true, result: sanitizeEvent(receipt.result, Number(member.seat)), view: currentView?.view || null });
      }
      if (!Number.isSafeInteger(expectedVersion) || expectedVersion !== Number(match.version)) throw new Error("stale_version");
      const game = new gameCore.DuelGame({ seed: 1, multiplayer: true });
      const loaded = game.loadSnapshot(match.state);
      if (!loaded.ok) throw new Error("invalid_match_state");
      const result = runCommand(game, Number(member.seat), String(body.type || ""), body.payload || {});
      const snapshot = game.snapshot();
      const { data: committed, error } = await service.rpc("commit_pvp_state", { p_match_id: match.id, p_expected_version: expectedVersion, p_actor_id: userId, p_action_id: actionId, p_state: snapshot, p_result: result, p_view_zero: projectState(snapshot, 0), p_view_one: projectState(snapshot, 1), p_event_zero: sanitizeEvent(result, 0), p_event_one: sanitizeEvent(result, 1), p_winner_seat: game.winner }).single();
      if (error) throw new Error(error.message.includes("stale_version") ? "stale_version" : error.message.includes("match_ended") ? "match_ended" : error.message);
      const committedRow = committed as { new_version: number; duplicate: boolean; stored_result: unknown };
      if (committedRow.duplicate) {
        const { data: currentView } = await service.from("pvp_player_views").select("view").eq("room_id", roomId).eq("user_id", userId).single();
        return reply(request, { ok: true, requestId, version: committedRow.new_version, duplicate: true, result: sanitizeEvent(committedRow.stored_result, Number(member.seat)), view: currentView?.view || null });
      }
      return reply(request, { ok: true, requestId, version: committedRow.new_version, duplicate: false, result: sanitizeEvent(committedRow.stored_result, Number(member.seat)), view: projectState(snapshot, Number(member.seat)) });
    }
    if (operation === "forfeit" || operation === "claim-timeout") {
      const { data: winner, error } = await service.rpc("finish_pvp_room", { p_room_id: roomId, p_actor_id: userId, p_reason: operation });
      if (error) throw new Error(error.message.includes("disconnect_grace_active") ? "disconnect_grace_active" : error.message.includes("room_ended") ? "room_ended" : error.message);
      const winnerSeat = winner == null ? null : Number(winner);
      return reply(request, { ok: true, requestId, winnerSeat });
    }
    return reply(request, { ok: false, requestId, error: "unknown_operation" }, 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : "internal_error";
    const status = ["room_not_found", "match_not_found"].includes(message) ? 404 : ["stale_version", "match_ended", "room_ended", "room_not_waiting", "ruleset_mismatch"].includes(message) ? 409 : 400;
    return reply(request, { ok: false, requestId, error: message }, status);
  }
});
