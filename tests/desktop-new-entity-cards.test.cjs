const test = require("node:test");
const assert = require("node:assert/strict");
const { DuelGame, HEROES } = require("../demo/core.js");
const catalog = require("../demo/card-library/catalog.js");

const byId = (id) => catalog.cards.find((card) => card.id === id);
const clone = (value) => JSON.parse(JSON.stringify(value));

function start() {
  const game = new DuelGame({ seed: 827, firstPlayer: 0, playerPreset: "rover-female-yangyang-chixia", aiPreset: "rover-male-jinhsi-sanhua" });
  assert.equal(game.confirmSetup(0).started, true);
  return game;
}

function installHeroes(game, playerIndex, heroIds, activeHero = 0) {
  const player = game.players[playerIndex];
  player.heroes = heroIds.map((heroId) => {
    const startCard = clone(catalog.cards.find((card) => card.type === "character" && card.hero === heroId && card.level === 0));
    return Object.assign(clone(HEROES[heroId]), { level: 0, stack: [startCard], roleCardIds: [startCard.id] });
  });
  const used = new Set(player.heroes.flatMap((hero) => hero.roleCardIds));
  player.roleDeck = catalog.cards.filter((card) => card.type === "character" && heroIds.includes(card.hero) && !used.has(card.id)).map(clone);
  player.activeHero = activeHero;
  return player;
}

function action(game, id, overrides = {}) {
  return game.makeCard(Object.assign(clone(byId(id) || {}), overrides));
}

test("咔咔压制未获得优势仍可普通打出，获得优势时才取回指定弃牌", () => {
  const game = start();
  installHeroes(game, 0, ["chixia", "yangyang", "roverFemale"]);
  const kaka = action(game, "BP01-072");
  assert.equal(game.canUseCard(0, kaka, "contest"), true);
  assert.equal(game.triggerContestEffects(0, kaka, null).deferred.length, 0);
  const normal = action(game, "SD01-012");
  game.players[0].discard = [normal];
  game.players[0].advantageReady = true;
  const effect = game.triggerContestEffects(0, kaka, null);
  const operation = effect.deferred.find((item) => item.type === "discard-filtered-to-hand");
  assert.ok(operation);
  assert.equal(game.resolveDeferredChoice(0, effect.effectId, operation.operationId, normal.uid).ok, true);
  game.commitPendingDeferredEffect(0, effect.effectId);
  assert.ok(game.players[0].hand.some((card) => card.uid === normal.uid));
});

test("黑白羊咩既可对抗也可连击，使用后禁止本回合继续连击", () => {
  const game = start();
  installHeroes(game, 0, ["encore", "shorekeeper", "camellya"]);
  const lamb = action(game, "BP01-061");
  assert.equal(game.canUseCard(0, lamb, "contest"), true);
  game.players[0].hand = [lamb];
  game.pursuit = { playerIndex: 0, originPlayer: 0, remaining: Infinity, source: "red" };
  game.phase = "pursuit";
  const result = game.playCombo(0, lamb.uid);
  assert.equal(result.ok, true);
  assert.equal(result.ended, true);
  assert.equal(game.players[0].cannotComboThisTurn, true);
  assert.equal(game.pursuit, null);
});

test("炽霞实体Lv2与安可Lv1延迟伤害都在对抗阶段结束时生成独立动画伤害事件", () => {
  const game = start();
  const player = installHeroes(game, 0, ["chixia", "encore", "shorekeeper"]);
  player.heroes[0].stack.push(clone(byId("BP01-025")));
  player.actionZone = [action(game, "SD01-012"), action(game, "SD02-007")];
  let effects = game.triggerContestEndEffects(0, player.actionZone[0], 1, action(game, "SD02-007"), 0);
  assert.ok(effects.some((effect) => effect.damageEvents.some((event) => event.amount === 3)));

  player.activeHero = 1;
  player.heroes[1].stack.push(clone(byId("BP01-014")));
  const heavy = action(game, "BP01-061", { name: "安可重击", actionType: "重击", attack: 4, tone: "gale" });
  const red = action(game, "SD02-007", { attack: 2 });
  effects = game.triggerContestEndEffects(0, heavy, 1, red, 1);
  assert.ok(effects.some((effect) => effect.damageEvents.some((event) => event.amount === 4)));
});

test("安可首次常态攻击加伤、登场取回红牌与受伤后回合结束取回均真实结算", () => {
  const game = start();
  const player = installHeroes(game, 0, ["encore", "shorekeeper", "camellya"]);
  const encore = player.heroes[0];
  const normalA = action(game, "BP01-061", { name: "安可常态攻击A", actionType: "常态攻击", attack: 2 });
  const normalB = action(game, "BP01-061", { name: "安可常态攻击B", actionType: "常态攻击", attack: 2 });
  game.markCardUsed(0, normalA);
  game.markCardUsed(0, normalB);
  assert.equal(game.cardStats(0, normalA).attack, 4);
  assert.equal(game.cardStats(0, normalB).attack, 2);

  const arrival = clone(byId("BP01-013"));
  encore.stack.push(arrival);
  const redEncore = action(game, "BP01-061");
  player.discard = [redEncore];
  const arrivalEffect = game.resolveRoleArrival(0, arrival, "升级", 0).roleTriggers[0];
  const arrivalOperation = arrivalEffect.deferred[0];
  game.resolveDeferredChoice(0, arrivalEffect.effectId, arrivalOperation.operationId, redEncore.uid);
  game.commitPendingDeferredEffect(0, arrivalEffect.effectId);
  assert.ok(player.hand.some((card) => card.uid === redEncore.uid));

  encore.stack.push(clone(byId("BP01-012")));
  const recovered = action(game, "BP01-061");
  player.discard = [recovered];
  game.players[1].damageTakenThisTurn = 1;
  const endEffect = game.triggerTurnEnd(0).find((effect) => effect.deferred?.some((operation) => operation.boundHero === "encore"));
  const endOperation = endEffect.deferred[0];
  game.resolveDeferredChoice(0, endEffect.effectId, endOperation.operationId, recovered.uid);
  game.commitPendingDeferredEffect(0, endEffect.effectId);
  assert.ok(player.hand.some((card) => card.uid === recovered.uid));
});

test("守岸人对抗开始补至5张、绿色对抗抽牌与胜利治疗、切换抽一弃一均结算", () => {
  const game = start();
  const player = installHeroes(game, 0, ["shorekeeper", "encore", "camellya"]);
  player.heroes[0].stack.push(clone(byId("BP01-008")), clone(byId("BP01-007")));
  player.hand = player.hand.slice(0, 3);
  const startEffect = game.triggerContestStart(0)[0];
  game.commitDeferredEffect(startEffect);
  assert.equal(player.hand.length, 5);

  const green = action(game, "SD01-015", { tone: "gale" });
  const contestEffect = game.triggerContestEffects(0, green, null);
  const contestTrigger = contestEffect.roleTriggers.find((trigger) => trigger.cardName === "守岸人");
  const beforeDraw = player.hand.length;
  game.commitDeferredEffect(contestTrigger);
  assert.equal(player.hand.length, beforeDraw + 1);

  player.hp = 18;
  const judgement = game.triggerJudgementEffects(0, green, action(game, "SD02-008", { tone: "tide" }), true);
  const healTrigger = judgement.roleTriggers.find((trigger) => trigger.heal === 1);
  game.commitDeferredEffect(healTrigger);
  game.commitDeferredEffect(judgement);
  assert.equal(player.hp, 19);

  player.activeHero = 1;
  player.switchedThisTurn = false;
  player.contestUsed = false;
  game.phase = "main";
  game.activePlayer = 0;
  assert.equal(game.pendingDeferredEffects.length, 0, JSON.stringify(game.pendingDeferredEffects));
  assert.equal(game.pendingEffectDiscard, null);
  const beforeSwitchHand = player.hand.length;
  const switched = game.switchHero(0, 0);
  assert.equal(switched.ok, true, switched.reason);
  assert.equal(switched.roleTriggers.length, 1);
  const switchOperation = switched.roleTriggers[0].deferred[0];
  assert.equal(game.resolveDeferredChoice(0, switched.roleTriggers[0].effectId, switchOperation.operationId, "accept").ok, true);
  game.commitDeferredEffect(switched.roleTriggers[0]);
  assert.equal(player.hand.length, beforeSwitchHand + 1);
  assert.equal(game.pendingEffectDiscard.count, 1);
});

test("秧秧实体Lv2可弃1张手牌切为领队，红椿盛绽免费升级且不占常规升级次数", () => {
  const game = start();
  const player = installHeroes(game, 0, ["yangyang", "camellya", "chixia"], 2);
  player.heroes[0].stack.push(clone(byId("BP01-022")));
  const discarded = player.hand[0];
  const yangyang = game.triggerTurnEnd(0).find((effect) => effect.deferred?.some((operation) => operation.type === "hand-discard-switch-leader"));
  const operation = yangyang.deferred[0];
  game.resolveDeferredChoice(0, yangyang.effectId, operation.operationId, discarded.uid);
  game.commitPendingDeferredEffect(0, yangyang.effectId);
  assert.equal(player.activeHero, 0);
  assert.ok(player.discard.some((card) => card.uid === discarded.uid));

  player.activeHero = 1;
  const bloom = action(game, "BP01-048");
  const bloomEffect = game.triggerContestEffects(0, bloom, null);
  const upgradeOperation = bloomEffect.deferred.find((item) => item.type === "free-role-upgrade");
  const choices = game.deferredChoiceCandidates(upgradeOperation);
  assert.ok(choices.length >= 2, "椿Lv.1存在多个实体卡选择");
  const chosen = choices.find((card) => card.id === "BP01-003") || choices[0];
  game.resolveDeferredChoice(0, bloomEffect.effectId, upgradeOperation.operationId, chosen.id);
  game.commitPendingDeferredEffect(0, bloomEffect.effectId);
  assert.equal(player.heroes[1].level, 1);
  assert.equal(player.upgradedThisTurn, false);
  assert.ok(player.heroes[1].roleCardIds.includes(chosen.id));
});

test("椿首次升至Lv2保留卡牌与领队技，再次升级弃3张后返回Lv1", () => {
  const game = start();
  const player = installHeroes(game, 0, ["camellya", "encore", "shorekeeper"], 0);
  const makeCosts = (count, prefix) => Array.from({ length: count }, (_, index) => action(game, "SD01-007", { id: `${prefix}-${index}`, name: `${prefix}${index}` }));

  player.hand = makeCosts(1, "升1代价");
  const levelOne = game.upgrade(0, 0, "BP01-004", player.hand.map((card) => card.uid));
  assert.equal(levelOne.ok, true, levelOne.reason);
  assert.equal(player.heroes[0].level, 1);

  player.upgradedThisTurn = false;
  player.hand = makeCosts(2, "升2代价");
  const levelTwo = game.upgrade(0, 0, "BP01-002", player.hand.map((card) => card.uid));
  assert.equal(levelTwo.ok, true, levelTwo.reason);
  assert.equal(player.heroes[0].level, 2);
  assert.ok(player.heroes[0].stack.some((card) => card.id === "BP01-002"));
  assert.ok(game.roleCard(0, /每回合受到的第二次伤害-1/));
  assert.ok(!player.roleDeck.some((card) => card.id === "BP01-002"));
  assert.equal(levelTwo.roleTriggers.length, 0, "首次升到Lv2不应触发回退");

  player.upgradedThisTurn = false;
  player.hand = makeCosts(3, "再次升级代价");
  const retrigger = game.upgradeOptions(0, 0).find((card) => card.id === "BP01-002");
  assert.equal(retrigger.retriggerUpgrade, true);
  assert.equal(game.upgradeCost(retrigger), 3);
  const returned = game.upgrade(0, 0, "BP01-002", player.hand.map((card) => card.uid));
  assert.equal(returned.ok, true, returned.reason);
  assert.equal(returned.retriggerUpgrade, true);
  assert.equal(player.heroes[0].level, 1);
  assert.ok(!player.heroes[0].stack.some((card) => card.id === "BP01-002"));
  assert.ok(player.roleDeck.some((card) => card.id === "BP01-002"));
  assert.equal(game.roleCard(0, /每回合受到的第二次伤害-1/), null);
});

test("解限胜利抽2；优势未触发时仍可使用，优势失败且守岸人领队时封锁对方连击", () => {
  const game = start();
  const player = installHeroes(game, 0, ["shorekeeper", "encore", "camellya"]);
  const unlock = action(game, "BP01-058");
  const red = action(game, "BP01-061", { tone: "blaze", attack: 1 });
  assert.equal(game.canUseCard(0, unlock, "contest"), true);

  const before = player.hand.length;
  const winEffect = game.triggerJudgementEffects(0, unlock, red, true);
  assert.equal(winEffect.draw, 2);
  game.commitDeferredEffect(winEffect);
  assert.equal(player.hand.length, before + 2);

  game.players[1].cannotComboThisTurn = false;
  player.advantageReady = false;
  game.triggerJudgementEffects(0, unlock, red, false);
  assert.equal(game.players[1].cannotComboThisTurn, false);

  player.advantageReady = true;
  player.activeHero = 1;
  game.triggerJudgementEffects(0, unlock, red, false);
  assert.equal(game.players[1].cannotComboThisTurn, false);

  player.activeHero = 0;
  const lossEffect = game.triggerJudgementEffects(0, unlock, red, false);
  assert.equal(game.players[1].cannotComboThisTurn, true);
  assert.ok(lossEffect.triggers.some((trigger) => trigger.detail.includes("对方不能连击")));
});
