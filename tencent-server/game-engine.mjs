await import("../mobile/card-library/catalog.js");
await import("../mobile/card-library/presets.js");
await import("../mobile/core.js");

export const gameCore = globalThis.WavesDuelCore;
if (!gameCore?.DuelGame) throw new Error("game_core_not_loaded");

export function asDeck(value) {
  const roleCards = Array.isArray(value?.roleCards) ? value.roleCards.map(String) : [];
  const actions = Array.isArray(value?.actions)
    ? value.actions.map((entry) => [String(entry?.[0] || ""), Number(entry?.[1])])
    : Object.entries(value?.actions || {}).map(([id, count]) => [id, Number(count)]);
  const heroIds = Array.isArray(value?.heroIds) ? value.heroIds.map(String) : [];
  const deck = {
    id: String(value?.id || "pvp-custom").slice(0, 64),
    name: String(value?.name || "自组卡组").slice(0, 20),
    heroIds,
    roleCards,
    actions,
  };
  gameCore.validatePresetConstruction(deck);
  return deck;
}

function commitQueuedDamage(game, result) {
  const events = [];
  if (result?.damageEvent) events.push(result.damageEvent);
  for (const effect of result?.effects || []) events.push(...(effect?.damageEvents || []));
  events.push(...(result?.effect?.damageEvents || []));
  for (const event of events) game.commitDamage(event);
}

function resolveDeferredEffect(game, seat, payload) {
  const effectId = String(payload?.effectId || "");
  const effect = (game.pendingDeferredEffects || []).find((item) => item?.effectId === effectId);
  if (!effect || Number(effect.playerIndex) !== seat) throw new Error("deferred_effect_not_owned");
  const choices = Array.isArray(payload?.choices) ? payload.choices : [];
  const pendingOperations = (effect.deferred || []).filter((operation) => !operation?.committed);
  const committed = game.resolveDeferredEffect(seat, effectId, choices);
  if (!committed?.ok) throw new Error(committed?.reason || "deferred_commit_failed");
  const metadata = pendingOperations.map((operation) => ({
    operationId:operation.operationId,
    playerIndex:operation.playerIndex,
    type:operation.type,
    revealed:operation.type === "deck-top-to-hand",
  }));
  return {
    ok:true,
    effectId,
    effect:{ effectId, playerIndex:effect.playerIndex, cardName:effect.cardName, text:effect.text, timing:effect.timing, note:effect.note },
    committed:(committed.committed || []).map((item, index) => ({ ...item, ...(metadata[index] || { playerIndex:seat }) })),
  };
}

export function runCommand(game, seat, type, payload = {}) {
  const commands = {
    choose_initiative:() => game.chooseInitiative(seat, Number(payload.choice)),
    mulligan:() => game.mulligan(seat, payload.uids || []),
    choose_leader:() => game.chooseLeader(seat, Number(payload.heroIndex)),
    confirm_setup:() => game.confirmSetup(seat),
    charge:() => game.charge(seat, String(payload.uid || "")),
    upgrade:() => game.upgrade(seat, Number(payload.heroIndex), String(payload.roleCardId || ""), payload.discardUids || []),
    switch_hero:() => game.switchHero(seat, Number(payload.heroIndex)),
    begin_contest:() => game.beginContest(seat, String(payload.uid || "")),
    respond_contest:() => game.respondContest(seat, payload.uid ? String(payload.uid) : null),
    resolve_payment:() => game.resolvePaymentChoice(seat, Boolean(payload.accept)),
    resolve_choice:() => game.resolveChoice(seat, payload.choice || {}),
    discard_effect:() => game.discardForEffect(seat, payload.uids || []),
    discard_hand_limit:() => game.discardForHandLimit(seat, payload.uids || []),
    play_combo:() => game.playCombo(seat, String(payload.uid || "")),
    resolve_deferred_effect:() => resolveDeferredEffect(game, seat, payload),
    end_pursuit:() => game.endPursuit(seat),
    end_turn:() => game.endTurn(seat),
  };
  if (!commands[type]) throw new Error("unsupported_command");
  const result = commands[type]();
  if (!result?.ok) throw new Error(result?.reason || "illegal_action");
  commitQueuedDamage(game, result);
  result.commandType = type;
  result.actorSeat = seat;
  return result;
}
