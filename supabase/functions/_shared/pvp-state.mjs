function clone(value) { return JSON.parse(JSON.stringify(value)); }
function hiddenCards(count) { return Array.from({ length: Math.max(0, Number(count) || 0) }, () => ({ hidden: true })); }
const PLAYER_INDEX_KEYS = new Set(["playerIndex", "opponentIndex", "initiator", "responder", "originPlayer", "payerIndex", "damageTarget", "turnEndPlayerIndex", "winningPlayer", "handLimitPlayer", "activePlayer", "coinWinner", "firstPlayer", "winner", "actorSeat"]);
function localIndex(value, seat) { return value === 0 || value === 1 ? (value === seat ? 0 : 1) : value; }
function remapPlayerReferences(value, seat, key = "") {
  if (Array.isArray(value)) return value.map((item) => remapPlayerReferences(item, seat));
  if (!value || typeof value !== "object") return PLAYER_INDEX_KEYS.has(key) ? localIndex(value, seat) : value;
  const output = {};
  for (const [childKey, child] of Object.entries(value)) {
    if (childKey === "players" && Array.isArray(child)) {
      const ordered = seat === 0 ? child : [child[1], child[0]];
      output.players = ordered.map((player, index) => ({ ...remapPlayerReferences(player, seat), index }));
    } else if (childKey === "matchStats" && child && typeof child === "object") {
      output.matchStats = Object.fromEntries(Object.entries(child).map(([stat, entries]) => [stat, seat === 1 && Array.isArray(entries) ? [entries[1], entries[0]] : entries]));
    } else output[childKey] = remapPlayerReferences(child, seat, childKey);
  }
  return output;
}
function scrubDeferredPrivacy(value, seat, inheritedOwner = null) {
  if (Array.isArray(value)) return value.map((item) => scrubDeferredPrivacy(item, seat, inheritedOwner));
  if (!value || typeof value !== "object") return value;
  const owner = value.playerIndex === 0 || value.playerIndex === 1 ? value.playerIndex : inheritedOwner;
  const output = {};
  for (const [key, child] of Object.entries(value)) {
    if (owner !== seat && ["selectedUid", "candidates"].includes(key)) continue;
    output[key] = scrubDeferredPrivacy(child, seat, owner);
  }
  return output;
}
function sanitizeCommittedCards(value, seat) {
  if (Array.isArray(value)) return value.map((item) => sanitizeCommittedCards(item, seat));
  if (!value || typeof value !== "object") return value;
  const output = Object.fromEntries(Object.entries(value).map(([key, child]) => [key, sanitizeCommittedCards(child, seat)]));
  if (Array.isArray(value.cards) && value.playerIndex !== seat && value.destination === "hand" && !value.revealed) output.cards = hiddenCards(value.cards.length);
  return output;
}

export function projectState(snapshot, seat) {
  const state = clone(snapshot);
  state.selfSeat = seat;
  state.players = state.players.map((player, index) => {
    const own = index === seat;
    const projected = { ...player, deckCount: player.deck.length, roleDeckCount: player.roleDeck.length, handCount: player.hand.length };
    if (!own) { delete projected.presetId; delete projected.presetName; }
    projected.deck = hiddenCards(player.deck.length);
    projected.hand = own ? player.hand : hiddenCards(player.hand.length);
    projected.roleDeck = own ? player.roleDeck : hiddenCards(player.roleDeck.length);
    projected.actionZone = player.actionZone.map((card) => !own && card?.facedown ? { uid: card.uid, facedown: true, hidden: true } : card);
    if (!state.heroesRevealed && !own) projected.heroes = player.heroes.map(() => ({ hidden: true, stack: [] }));
    return projected;
  });
  if (state.pending?.initiator !== seat && state.pending?.initiatorCard) { state.pending.initiatorCard = { uid: state.pending.initiatorCard.uid, hidden: true }; delete state.pending.initiatorCost; }
  if (state.pendingChoice?.playerIndex !== seat) state.pendingChoice = null;
  if (state.pendingPayment?.payerIndex !== seat) state.pendingPayment = null;
  if (state.pendingEffectDiscard?.playerIndex !== seat) state.pendingEffectDiscard = null;
  state.pendingDeferredEffects = scrubDeferredPrivacy(state.pendingDeferredEffects || [], seat);
  state.lastTurnStartEffects = scrubDeferredPrivacy(state.lastTurnStartEffects, seat);
  state.pendingTurnEndEffects = scrubDeferredPrivacy(state.pendingTurnEndEffects, seat);
  const localized = remapPlayerReferences(state, seat);
  localized.selfSeat = 0;
  return localized;
}

export function sanitizeEvent(result, seat) {
  let event = scrubDeferredPrivacy(clone(result || {}), seat);
  if (event.pending && event.card) event.card = { uid: event.card.uid, hidden: true };
  if (Array.isArray(event.choices)) event.choices = event.choices.filter((choice) => choice.playerIndex === seat);
  event = sanitizeCommittedCards(event, seat);
  return remapPlayerReferences(event, seat);
}
