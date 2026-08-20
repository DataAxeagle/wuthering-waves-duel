const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { DuelGame, TONES } = require("../demo/core.js");
const catalog = require("../demo/card-library/catalog.js");

function start() {
  const game = new DuelGame({ seed: 42, firstPlayer: 0, playerPreset: "rover-male-jinhsi-sanhua", aiPreset: "rover-female-yangyang-chixia" });
  assert.equal(game.confirmSetup(0).started, true);
  return game;
}
function card(game, values) { return game.makeCard(Object.assign({ name: "测试卡", kind: "attack", tone: "blaze", cost: 0, attack: 1, speed: 1, text: "" }, values)); }
function energy(game, index, count) { const p = game.players[index]; p.chargeZone = Array.from({ length: count }, (_, i) => card(game, { name: `协奏${i}`, tone: "tide", kind: "dodge" })); p.energy = count; }

test("桌面版 AI 的决策与动画异常会停止 AI 追击，并在 finally 释放操作锁", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "demo", "game.js"), "utf8");
  const responseSource = source.slice(source.indexOf("  async function aiRespond()"), source.indexOf("\n  async function endHumanTurn()"));
  const turnSource = source.slice(source.indexOf("  async function runAiTurn()"), source.indexOf("\n  function showResponse()"));

  for (const handler of [responseSource, turnSource]) {
    assert.match(handler, /try \{/);
    assert.match(handler, /catch \(error\) \{[\s\S]*?hideAnimationScene\(\);[\s\S]*?game\.endPursuit\(1\)/);
    assert.match(handler, /finally \{[\s\S]*?aiRunning = false;[\s\S]*?uiLocked = false;/);
  }
});

test("抛硬币获胜者选择先后手，双方起手五张", () => {
  const game = new DuelGame({ seed: 7 });
  assert.deepEqual(game.players.map((p) => p.hand.length), [5, 5]);
  const chooser = game.coinWinner;
  assert.equal(game.chooseInitiative(chooser, chooser).ok, true);
});

test("有效自组牌组可作为我方预设进入对局", () => {
  const heroIds = [...new Set(catalog.cards.filter((card) => card.type === "character").map((card) => card.hero))].slice(0, 3);
  const roleCards = catalog.cards.filter((card) => card.type === "character" && heroIds.includes(card.hero)).map((card) => card.id);
  const actionCards = catalog.cards.filter((card) => card.type === "action").slice(0, 14);
  const actions = actionCards.map((card, index) => [card.id, index < 12 ? 3 : 2]);
  const custom = { id: "custom-test", name: "自组测试", heroIds, roleCards, actions };
  const game = new DuelGame({ seed: 9, firstPlayer: 0, playerPresetData: custom, aiPreset: "rover-male-jinhsi-sanhua" });
  assert.equal(game.players[0].presetName, "自组测试");
  assert.equal(game.players[0].heroes.length, 3);
  assert.equal(game.players[0].deck.length + game.players[0].hand.length, 40);
});

test("自组角色卡逐张生效，可只携带指定的同名等级卡而非自动补齐全部角色卡", () => {
  const heroIds = ["rover", "jinhsi", "sanhua"];
  const roleCards = ["BP01-021", "SD02-002", "BP01-030", "BP01-033"];
  const actionCards = catalog.cards.filter((card) => card.type === "action" && (!card.hero || heroIds.includes(card.hero)) && (!card.leaderOnly || heroIds.includes(card.leaderOnly))).slice(0, 14);
  const actions = actionCards.map((card, index) => [card.id, index < 12 ? 3 : 2]);
  const custom = { id: "custom-single-role-cards", name: "逐张角色测试", heroIds, roleCards, actions };
  const game = new DuelGame({ seed: 10, firstPlayer: 0, playerPresetData: custom, aiPreset: "rover-female-yangyang-chixia" });
  assert.equal(game.players[0].heroes.find((hero) => hero.id === "rover").stack.length, 1);
  assert.deepEqual(game.players[0].roleDeck.map((card) => card.id), ["SD02-002"]);
});

test("构筑校验拒绝缺少 Lv.0、第四种角色与不在角色卡组中的专属行动卡", () => {
  const actions = [["SD02-017", 3], ["SD02-019", 3], ["SD02-012", 3], ["SD02-014", 3], ["SD02-015", 3], ["SD02-007", 3], ["SD02-009", 3], ["SD02-011", 3], ["SD02-018", 3], ["SD02-013", 3], ["SD02-008", 3], ["SD02-020", 3], ["SD02-021", 3], ["SD02-022", 1]];
  const valid = { id: "valid-construction", name: "合法构筑", heroIds: ["rover", "jinhsi", "sanhua"], roleCards: ["BP01-021", "BP01-030", "BP01-033"], actions };
  assert.doesNotThrow(() => new DuelGame({ seed: 11, playerPresetData: valid, aiPreset: "rover-female-yangyang-chixia" }));
  assert.throws(() => new DuelGame({ seed: 12, playerPresetData: { ...valid, roleCards: ["SD02-002", "BP01-030", "BP01-033"] }, aiPreset: "rover-female-yangyang-chixia" }), /角色卡组构筑规则/);
  assert.throws(() => new DuelGame({ seed: 13, playerPresetData: { ...valid, heroIds: [...valid.heroIds, "roverFemale"], roleCards: [...valid.roleCards, "BP01-018"] }, aiPreset: "rover-female-yangyang-chixia" }), /角色卡组构筑规则/);
  assert.throws(() => new DuelGame({ seed: 14, playerPresetData: { ...valid, actions: [...actions.slice(0, -1), ["SD01-010", 1]] }, aiPreset: "rover-female-yangyang-chixia" }), /行动卡组构筑规则/);
});

test("回合开始与结束的角色触发按卡面时机抽牌", () => {
  const game = start();
  const player = game.players[0];
  player.heroes[0].stack.push({ text: "【各回合结束时】抽1张卡。" });
  const beforeEnd = player.hand.length;
  game.triggerTurnEnd(0).forEach((effect) => game.commitDeferredEffect(effect));
  assert.equal(player.hand.length, beforeEnd + 1);
  player.heroes[0].stack.push({ text: "【己方回合开始时】抽1张卡。" });
  const beforeStart = player.hand.length;
  game.triggerTurnStart(0).forEach((effect) => game.commitDeferredEffect(effect));
  assert.equal(player.hand.length, beforeStart + 1);
});

test("男漂泊者 Lv.2 在任一方回合结束时都为己方抽牌，女漂泊者仅在己方回合开始时额外抽牌", () => {
  const game = start();
  game.players[0].heroes[0].stack.push({ name: "漂泊者（男）", text: "【领队】【各回合结束时】抽1张卡。" });
  const maleBefore = game.players[0].hand.length;
  game.startTurn(1, false);
  const turnEnd = game.finishTurn(1);
  turnEnd.turnEndEffects.forEach((effect) => game.commitDeferredEffect(effect));
  assert.equal(game.players[0].hand.length, maleBefore + 3);
  assert.deepEqual(turnEnd.turnEndEffects.map((effect) => ({ playerIndex: effect.playerIndex, cardName: effect.cardName, draw: effect.draw })), [{ playerIndex: 0, cardName: "漂泊者（男）", draw: 1 }]);

  const female = new DuelGame({ seed: 43, firstPlayer: 0, playerPreset: "rover-female-yangyang-chixia", aiPreset: "rover-male-jinhsi-sanhua" });
  assert.equal(female.confirmSetup(0).started, true);
  female.players[0].heroes[0].stack.push({ name: "漂泊者（女）", text: "【己方回合开始时】抽1张卡。" });
  const beforeOwnTurn = female.players[0].hand.length;
  female.startTurn(0, false);
  female.lastTurnStartEffects.effects.forEach((effect) => female.commitDeferredEffect(effect));
  assert.equal(female.players[0].hand.length, beforeOwnTurn + 3);
  assert.equal(female.lastTurnStartEffects.effects[0].draw, 1);
  assert.equal(female.lastTurnStartEffects.effects[0].deferred[0].committed, true);
  const beforeOpponentTurn = female.players[0].hand.length;
  female.startTurn(1, false);
  assert.equal(female.players[0].hand.length, beforeOpponentTurn);
  assert.deepEqual(female.lastTurnStartEffects.effects, []);
});

test("女漂泊者 Lv.2 的回合开始抽牌提交后，才进行常规抽牌", () => {
  const game = new DuelGame({ seed: 44, firstPlayer: 0, playerPreset: "rover-female-yangyang-chixia", aiPreset: "rover-male-jinhsi-sanhua" });
  assert.equal(game.confirmSetup(0).started, true);
  const player = game.players[0];
  player.heroes[0].stack.push({ name: "漂泊者（女）", text: "【己方回合开始时】抽1张卡。" });
  player.hand = [];
  player.deck = [card(game, { name: "常规抽牌二" }), card(game, { name: "常规抽牌一" }), card(game, { name: "角色效果抽牌" })];

  game.startTurn(0, false);

  assert.equal(game.phase, "turn-start");
  assert.deepEqual(player.hand.map((item) => item.name), []);
  assert.equal(game.lastTurnDraw.pending, true);
  const effect = game.lastTurnStartEffects.effects[0];
  game.commitDeferredEffect(effect);

  assert.equal(game.phase, "main");
  assert.equal(game.lastTurnDraw.pending, false);
  assert.deepEqual(player.hand.map((item) => item.name), ["角色效果抽牌", "常规抽牌一", "常规抽牌二"]);
});

test("桌面端先展示并提交回合开始角色效果，再展示常规抽牌", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "demo", "game.js"), "utf8");
  const sequence = source.slice(source.indexOf("async function animateTurnStartSequence"), source.indexOf("async function animateTriggeredEffect"));
  assert.ok(sequence.indexOf("animateAndCommitDeferredEffect") < sequence.indexOf("animateTurnDraw"));
});

test("炽霞 Lv.2、啾啾斗意与朔风旋涌按卡面处理伤害、回手和下回合红牌加费", () => {
  const game = start();
  game.players[0].activeHero = 2;
  game.players[0].heroes[2].stack.push({ text: "己方拥有【领队技】的「炽霞」卡伤害+3。" });
  const chixiaSkill = card(game, { id: "SD01-011", leaderOnly: "chixia", attack: 7 });
  assert.equal(game.cardStats(0, chixiaSkill).attack, 10);

  const returnCard = card(game, { id: "SD01-010", leaderOnly: "chixia", tone: "blaze", attack: 2, speed: 8, text: "【判定】若己方以此卡对抗蓝色卡失败，己方可以将此卡加入手牌。" });
  const blue = card(game, { tone: "tide", kind: "dodge" });
  game.players[0].hand = [returnCard]; game.players[1].hand = [blue];
  game.beginContest(0, returnCard.uid); const returnResult = game.respondContest(1, blue.uid); (returnResult.effects || []).forEach((effect) => game.commitDeferredEffect(effect));
  assert.ok(game.players[0].hand.some((item) => item.uid === returnCard.uid));

  const effect = game.triggerJudgementEffects(0, card(game, { tone: "blaze", text: "【判定】若己方胜利，下个回合中，对方的红色卡费用+1。" }), blue, true);
  game.commitDeferredEffect(effect); assert.equal(effect.redCardCostIncreaseNextTurn, true);
  game.startTurn(1, false);
  assert.equal(game.cardCost(1, card(game, { tone: "blaze", cost: 2 })), 3);
  assert.equal(game.cardCost(1, card(game, { tone: "tide", cost: 2 })), 2);
});

test("禁止下回合连击只封锁目标的下一回合", () => {
  const game = start();
  const player = game.players[0];
  player.cannotComboNextTurn = true;
  game.startTurn(0, false);
  assert.equal(player.cannotComboThisTurn, true);
  assert.equal(player.cannotComboNextTurn, false);
  game.startTurn(0, false);
  assert.equal(player.cannotComboThisTurn, false);
});

test("移岁迷邪只在己方行动区达到三张时连击额外造成三点伤害", () => {
  const game = start();
  const player = game.players[0];
  const migui = card(game, { name: "移岁迷邪", text: "【连击】若己方行动区有3张或以上的卡，此卡伤害+3。", attack: 5 });
  player.actionZone = [card(game, {}), migui];
  game.players[1].actionZone = [card(game, {}), card(game, {})];
  assert.equal(game.comboDamageBonus(0, migui, true), 0);
  player.actionZone = [card(game, {}), card(game, {}), migui];
  assert.equal(game.comboDamageBonus(0, migui, false), 0);
  assert.equal(game.comboDamageBonus(0, migui, true), 3);
});

test("移岁迷邪在首轮己方牌后再完成一次追击时，会计入自身成为行动区第 3 张并获得加伤", () => {
  const game = start();
  game.players[0].activeHero = 1;
  const opening = card(game, { name: "首轮红牌" });
  const firstCombo = card(game, { name: "第一次追击" });
  const migui = card(game, { id: "SD02-011", name: "移岁迷邪", leaderOnly: "jinhsi", attack: 5, text: "【领队技】己方领队为此卡专属角色时方可使用；【连击】若己方行动区有3张或以上的卡，此卡伤害+3。" });
  const guard = card(game, { name: "对方绿牌", tone: "gale", attack: 0 });
  game.players[0].hand = [opening, firstCombo, migui];
  game.players[1].hand = [guard];
  game.beginContest(0, opening.uid);
  game.respondContest(1, guard.uid);
  assert.equal(game.playCombo(0, firstCombo.uid).ok, true);
  const result = game.playCombo(0, migui.uid);
  assert.equal(game.players[0].actionZone.length, 3);
  assert.equal(result.effect.damage, 8);
});

test("闪避获胜后抽牌并由效果拥有者自主选择弃置手牌", () => {
  const game = start();
  const dodge = card(game, { name: "化声为形·闪避", tone: "tide", kind: "dodge", text: "【判定】若己方胜利，抽1张卡，己方丢弃1张手牌。" });
  const red = card(game, { name: "红色对抗", tone: "blaze", attack: 1 });
  const keep = card(game, { name: "保留手牌" });
  game.players[0].hand = [dodge, keep];
  game.players[1].hand = [red];
  game.beginContest(0, dodge.uid);
  game.respondContest(1, red.uid);
  assert.deepEqual(game.pendingEffectDiscard && { playerIndex: game.pendingEffectDiscard.playerIndex, count: game.pendingEffectDiscard.count }, { playerIndex: 0, count: 1 });
  assert.equal(game.phase, "effect-discard");
  assert.equal(game.activePlayer, 0);
  const discardResult = game.discardForEffect(0, [keep.uid]);
  assert.equal(discardResult.ok, true);
  assert.ok(game.players[0].discard.some((card) => card.uid === keep.uid));
  assert.equal(game.activePlayer, 0);
  assert.equal(game.phase, "post-battle");
  assert.equal(game.endTurn(0).ok, true);
  assert.equal(game.activePlayer, 1);
});

test("双方蓝色卡对抗时双方依次结算抽牌与弃牌", () => {
  const game = start();
  const text = "【判定】若己方胜利，抽1张卡，己方丢弃1张手牌。";
  const mine = card(game, { name: "我方蓝色测试", tone: "tide", kind: "dodge", text });
  const theirs = card(game, { name: "对方蓝色测试", tone: "tide", kind: "dodge", text });
  const mineDiscard = card(game, { name: "我方待弃" });
  const theirDiscard = card(game, { name: "对方待弃" });
  game.players[0].hand = [mine, mineDiscard];
  game.players[1].hand = [theirs, theirDiscard];
  game.beginContest(0, mine.uid);
  game.respondContest(1, theirs.uid);
  assert.equal(game.phase, "effect-discard");
  assert.equal(game.pendingEffectDiscard.playerIndex, 0);
  assert.equal(game.pendingEffectDiscardQueue.length, 1);
  assert.equal(game.discardForEffect(0, [mineDiscard.uid]).ok, true);
  assert.equal(game.pendingEffectDiscard.playerIndex, 1);
  assert.equal(game.discardForEffect(1, [theirDiscard.uid]).ok, true);
  assert.equal(game.pendingEffectDiscard, null);
  assert.equal(game.activePlayer, 0);
  assert.equal(game.phase, "post-battle");
  assert.equal(game.endTurn(0).ok, true);
  assert.equal(game.activePlayer, 1);
});

test("牌库用尽时弃牌区洗回，不造成疲劳伤害", () => {
  const game = start();
  const p = game.players[0];
  p.deck = []; p.discard = [card(game, { name: "回收卡" })]; const hp = p.hp;
  assert.equal(game.draw(0).name, "回收卡");
  assert.equal(p.hp, hp);
});

test("红克绿、同速由回合方获胜，行动卡留在行动区至回合结束", () => {
  const game = start();
  const red = card(game, { name: "红", attack: 3, speed: 5 });
  const green = card(game, { name: "绿", tone: "gale", attack: 9, speed: 5 });
  game.players[0].hand = [red]; game.players[1].hand = [green];
  let result = game.beginContest(0, red.uid); result = game.respondContest(1, green.uid);
  assert.equal(result.winningPlayer, 0); assert.equal(game.players[0].actionZone.length, 1); assert.equal(game.players[1].actionZone.length, 1);
  assert.equal(game.endPursuit(0).ok, true); assert.equal(game.phase, "post-battle"); assert.equal(game.endTurn(0).ok, true); assert.equal(game.players[0].actionZone.length + game.players[1].actionZone.length, 0);
});

test("响应方即使持有可用行动卡，也可以选择本次不出牌", () => {
  const game = start();
  const red = card(game, { name: "发起红", attack: 2, speed: 4 });
  const available = card(game, { name: "可用绿", tone: "gale", attack: 4, speed: 3 });
  game.players[0].hand = [red];
  game.players[1].hand = [available];
  game.beginContest(0, red.uid);
  const result = game.respondContest(1, null);
  assert.equal(result.ok, true);
  assert.equal(result.responseCard, null);
  assert.equal(result.winningPlayer, 0);
  assert.equal(game.players[1].hand[0].uid, available.uid);
});

test("男女漂泊者 Lv.0 以绿色卡对抗时无论胜负均抽取两张卡", () => {
  for (const preset of ["rover-male-jinhsi-sanhua", "rover-female-yangyang-chixia"]) {
    const game = new DuelGame({ seed: 31, firstPlayer: 0, playerPreset: preset, aiPreset: "rover-male-jinhsi-sanhua" });
    assert.equal(game.confirmSetup(0).started, true);
    game.players[0].activeHero = 0;
    for (const opponent of [card(game, { name: "红色获胜测试", tone: "blaze", attack: 0, speed: 2 }), card(game, { name: "蓝色失败测试", tone: "tide", kind: "dodge" })]) {
      const green = card(game, { name: "绿色对抗测试", tone: "gale", attack: 0, speed: 1 });
      game.players[0].hand = [green]; game.players[1].hand = [opponent];
      game.beginContest(0, green.uid);
      const result = game.respondContest(1, opponent.uid);
      const leaderEffect = result.effects.find((effect) => effect.playerIndex === 0 && effect.draw === 2);
      assert.ok(leaderEffect, `${preset} 的 Lv.0 应在绿色牌对抗时抽 2 张`);
      const roleTrigger = result.effects.flatMap((effect) => effect.roleTriggers || []).find((trigger) => trigger.playerIndex === 0 && trigger.draw === 2);
      assert.deepEqual(roleTrigger && { cardName: roleTrigger.cardName, timing: roleTrigger.timing, draw: roleTrigger.draw }, { cardName: game.players[0].heroes[0].name, timing: "判定", draw: 2 });
      game.startTurn(0, false);
    }
  }
});

test("红色获胜有无限连击；绿色牌只能通过追击效果得到有限次数", () => {
  const redGame = start(); const red = card(redGame, { name: "红", attack: 2 }); const greenLoss = card(redGame, { name: "绿", kind: "attack", tone: "gale" });
  redGame.players[0].hand = [red]; redGame.players[1].hand = [greenLoss]; redGame.beginContest(0, red.uid); redGame.respondContest(1, greenLoss.uid);
  assert.equal(redGame.pursuit.remaining, Infinity); assert.equal(redGame.legalPursuitCards(0).length, 0);
  const greenGame = start(); const green = card(greenGame, { name: "追击绿", tone: "gale", speed: 5, text: "【判定】若己方胜利，【追击2】本回合可连击次数增加2。" }); const guard = card(greenGame, { name: "蓝", kind: "dodge", tone: "tide" }); const follow = card(greenGame, { name: "红连", attack: 2 });
  greenGame.players[0].hand = [green, follow]; greenGame.players[1].hand = [guard]; greenGame.beginContest(0, green.uid); greenGame.respondContest(1, guard.uid);
  assert.equal(greenGame.pursuit.remaining, 2); assert.equal(greenGame.playCombo(0, follow.uid).ok, true); assert.equal(greenGame.pursuit.remaining, 1);
});

test("乘岁凌霜锁定本回合领队切换，胜利后抽3并获得8次追击", () => {
  const game = start();
  game.players[0].activeHero = 1;
  const ling = card(game, { id: "SD02-010", name: "乘岁凌霜", tone: "gale", cost: 1, speed: 13, leaderOnly: "jinhsi", text: "【领队技】己方领队为此卡专属角色时方可使用；【对抗】本回合中己方不能切换领队。【判定】若己方胜利，抽3张卡，【追击8】本回合可连击次数增加8。" });
  const blue = card(game, { name: "蓝色防御", kind: "dodge", tone: "tide" });
  const switchCombo = card(game, { name: "连击换位", text: "【连击】切换己方领队，若「今汐」是被切换的角色之一，此卡伤害+2。" });
  energy(game, 0, 1); game.players[0].hand = [ling, switchCombo]; game.players[1].hand = [blue];
  const beforeDraw = game.players[0].hand.length;
  game.beginContest(0, ling.uid); const result = game.respondContest(1, blue.uid);
  result.effects.forEach((effect) => game.commitDeferredEffect(effect));
  assert.equal(game.players[0].cannotSwitchThisTurn, true);
  assert.equal(result.pursuit.remaining, 8);
  assert.equal(result.effects.find((effect) => effect.playerIndex === 0 && effect.draw === 3).draw, 3);
  assert.equal(game.players[0].hand.length, beforeDraw - 1 + 3);
  assert.equal(game.playCombo(0, switchCombo.uid).ok, false);
});

test("蓝色战胜红色时先生成待结算伤害，动画后才实际扣血", () => {
  const game = start(); const red = card(game, { name: "红", attack: 4 }); const blue = card(game, { name: "反击蓝", kind: "dodge", tone: "tide", attack: 3 });
  game.players[0].hand = [red]; game.players[1].hand = [blue]; game.beginContest(0, red.uid); const result = game.respondContest(1, blue.uid);
  assert.equal(result.winningPlayer, 1); assert.equal(game.players[0].hp, 20);
  const attackEffect = result.effects.find((effect) => effect.attack === 3);
  assert.equal(attackEffect.damageEvents.length, 1);
  assert.equal(game.commitDamage(attackEffect.damageEvents[0]), 3); assert.equal(game.players[0].hp, 17);
});

test("累计承伤记录实际扣除的生命，治疗单独记录且不会掩盖承伤", () => {
  const game = start();
  game.players[0].hp = 7;
  assert.equal(game.damage(0, 10, "致命测试"), 7);
  assert.equal(game.players[0].hp, 0);
  assert.equal(game.matchStats.damageReceived[0], 7);
  assert.equal(game.matchStats.damageDealt[1], 7);

  const healed = start();
  healed.damage(0, 18, "累计承伤测试");
  assert.equal(healed.heal(0, 5), 5);
  assert.equal(healed.players[0].hp, 7);
  assert.equal(healed.matchStats.damageReceived[0], 18);
  assert.equal(healed.matchStats.healingReceived[0], 5);
  assert.equal(healed.matchStats.damageReceived[0] - healed.matchStats.healingReceived[0], 13);
});

test("战斗开始后锁定主要行动；无追击的战斗结算后必须由回合方手动结束", () => {
  const game = start();
  const left = card(game, { name: "左蓝", kind: "dodge", tone: "tide", attack: 0 });
  const right = card(game, { name: "右蓝", kind: "dodge", tone: "tide", attack: 0 });
  const reserve = card(game, { name: "充能代价" });
  game.players[0].hand = [left, reserve]; game.players[1].hand = [right];
  assert.equal(game.beginContest(0, left.uid).ok, true);
  assert.match(game.charge(0, reserve.uid).reason, /现在不能充能/);
  assert.match(game.switchHero(0, 1).reason, /现在不能切换/);
  const result = game.respondContest(1, right.uid);
  assert.equal(result.pursuit, null);
  assert.equal(result.turnEnded, true);
  assert.equal(game.activePlayer, 0);
  assert.equal(game.phase, "post-battle");
  assert.equal(game.canTakeMainAction(0), false);
  assert.equal(game.canTakeMainAction(1), false);
  assert.equal(game.endTurn(0).ok, true);
  assert.equal(game.activePlayer, 1);
  assert.equal(game.phase, "main");
});

test("手牌上限会锁定正确玩家，并在弃牌后安全推进下一回合", () => {
  const game = start();
  game.players[0].hand = Array.from({ length: 9 }, (_, index) => card(game, { name: `上限牌${index}` }));
  const ended = game.finishTurn(0);
  assert.equal(ended.handLimitPlayer, 0);
  assert.equal(game.phase, "hand-limit");
  assert.equal(game.handLimitPlayer, 0);
  const discard = game.players[0].hand[0];
  const resolved = game.discardForHandLimit(0, [discard.uid]);
  assert.equal(resolved.ok, true);
  assert.equal(game.handLimitPlayer, null);
  assert.equal(game.players[0].hand.length, 8);
  assert.equal(game.activePlayer, 1);
  assert.equal(game.phase, "main");
});

test("无冠者手牌超限后弃牌可安全切回玩家回合", () => {
  const game = start();
  game.players[1].hand = Array.from({ length: 10 }, (_, index) => card(game, { name: `AI上限牌${index}` }));
  const ended = game.finishTurn(1);
  assert.equal(ended.handLimitPlayer, 1);
  const discards = game.players[1].hand.slice(0, 2).map((item) => item.uid);
  const resolved = game.discardForHandLimit(1, discards);
  assert.equal(resolved.ok, true);
  assert.equal(game.players[1].hand.length, 8);
  assert.equal(game.activePlayer, 0);
  assert.equal(game.phase, "main");
});

test("升级从角色卡组展示同名同级或高一级卡，并弃置对应等级数量手牌", () => {
  const game = start(); const cost = card(game, { name: "升级代价" }); const option = game.upgradeOptions(0, 0).find((item) => item.level === 1);
  game.players[0].hand = [cost]; const result = game.upgrade(0, 0, option.id, [cost.uid]);
  assert.equal(result.ok, true); assert.equal(game.players[0].heroes[0].level, 1); assert.equal(game.players[0].heroes[0].stack.length, 2);
});

test("升级会触发已叠放的【升级】角色效果，弃牌区取回由拥有者选择", () => {
  const game = start(); const player = game.players[0]; const hero = player.heroes[0];
  hero.id = "chixia"; hero.name = "炽霞"; hero.level = 1;
  hero.stack = [{ id: "chixia-lv1", hero: "chixia", level: 1, name: "炽霞", text: "【登场】【升级】可以将弃牌区1张〈常态攻击〉加入手牌。" }];
  const candidate = { id: "chixia-lv2", hero: "chixia", level: 2, name: "炽霞", text: "无额外登场效果" };
  const costA = card(game, { name: "升级代价 A" }), costB = card(game, { name: "升级代价 B" });
  const normalA = card(game, { name: "普攻 A", actionType: "常态攻击" }), normalB = card(game, { name: "普攻 B", actionSubtype: "普攻" });
  player.roleDeck = [candidate]; player.hand = [costA, costB]; player.upgradedThisTurn = false;
  const result = game.upgrade(0, 0, candidate.id, [costA.uid, costB.uid]);
  assert.equal(result.ok, true);
  assert.deepEqual(result.roleTriggers.map((trigger) => trigger.cardName), ["炽霞"]);
  const operation = result.roleTriggers[0].deferred[0];
  player.discard = [normalA, normalB];
  assert.deepEqual(game.deferredDiscardCandidates(operation).map((item) => item.uid), [normalA.uid, normalB.uid]);
  assert.equal(game.chooseDeferredDiscardCard(operation, normalA.uid).ok, true);
  game.commitDeferredEffect(result.roleTriggers[0]);
  assert.ok(player.hand.some((item) => item.uid === normalA.uid));
  assert.ok(player.discard.some((item) => item.uid === normalB.uid));
});

test("三色克制环保持官方方向", () => { assert.equal(TONES.blaze.beats, "gale"); assert.equal(TONES.gale.beats, "tide"); assert.equal(TONES.tide.beats, "blaze"); });

test("连击卡需要选择后台角色，并在切换后结算指定角色加成", () => {
  const game = start();
  const combo = card(game, { name: "蟠龙清辉", attack: 1, text: "【连击】切换己方领队，若「今汐」是被切换的角色之一，此卡伤害+2。" });
  game.players[0].hand = [combo];
  game.pursuit = { playerIndex: 0, originPlayer: 0, remaining: Infinity, source: "red" }; game.phase = "pursuit";
  const pending = game.playCombo(0, combo.uid);
  assert.equal(pending.choice.type, "combo-switch");
  assert.equal(game.players[1].hp, 20);
  const resolved = game.resolveChoice(0, { heroIndex: 1 });
  assert.equal(resolved.ok, true); assert.equal(game.players[0].activeHero, 1); assert.equal(resolved.effect.damage, 3); assert.equal(game.players[1].hp, 20);
  assert.equal(game.commitDamage(resolved.effect.damageEvents[0]), 3); assert.equal(game.players[1].hp, 17);
});

test("查看对方手牌在判定胜利后返回给效果拥有者", () => {
  const game = start();
  const scout = card(game, { name: "感知", tone: "gale", speed: 8, text: "【判定】若己方胜利，抽1张卡，查看对方手牌。" });
  const guard = card(game, { name: "闪避", kind: "dodge", tone: "tide" }); const hidden = card(game, { name: "隐藏手牌", tone: "blaze" });
  game.players[0].hand = [scout]; game.players[1].hand = [guard, hidden]; game.beginContest(0, scout.uid); const result = game.respondContest(1, guard.uid);
  assert.equal(result.choices[0].type, "view-hand");
  assert.deepEqual(result.choices[0].cards.map((item) => item.name), ["隐藏手牌"]);
});

test("AI 触发查看手牌时同样会生成可确认的展示数据", () => {
  const game = start();
  const blue = card(game, { name: "我方蓝", kind: "dodge", tone: "tide" });
  const scout = card(game, { name: "AI 感知", tone: "gale", speed: 8, text: "【判定】若己方胜利，查看对方手牌。" });
  const hidden = card(game, { name: "我方隐藏牌", tone: "blaze" });
  game.players[0].hand = [blue, hidden];
  game.players[1].hand = [scout];
  game.beginContest(0, blue.uid);
  const result = game.respondContest(1, scout.uid);
  const choice = result.choices.find((item) => item.playerIndex === 1);
  assert.equal(choice.type, "view-hand");
  assert.ok(choice.cards.some((item) => item.name === "我方隐藏牌"));
});

test("秧秧费用文本生成支付或不支付的真实选择", () => {
  const game = start(); const red = card(game, { name: "红色攻击", tone: "blaze", attack: 1 }); const green = card(game, { name: "绿色对抗", tone: "gale" });
  game.players[1].activeHero = 1; game.players[1].heroes[1].stack.push({ text: "【领队】【对抗】对方以红色卡对抗时，对方可以支付1点费用，若未支付，对方受到3点伤害。" }); energy(game, 0, 1);
  game.players[0].hand = [red]; game.players[1].hand = [green]; game.beginContest(0, red.uid); const result = game.respondContest(1, green.uid);
  assert.equal(result.paymentChoices.length, 1); assert.equal(game.pendingPayment.payerIndex, 0);
  const paid = game.resolvePaymentChoice(0, true); assert.equal(paid.ok, true); assert.equal(paid.damage, 0); assert.equal(game.players[0].energy, 0); assert.equal(game.players[0].hp, 20);
  const retry = start(); const retryRed = card(retry, { name: "红色攻击", tone: "blaze", attack: 1 }); const retryGreen = card(retry, { name: "绿色对抗", tone: "gale" }); retry.players[1].activeHero = 1; retry.players[1].heroes[1].stack.push({ text: "【领队】【对抗】对方以红色卡对抗时，对方可以支付1点费用，若未支付，对方受到3点伤害。" }); energy(retry, 0, 1); retry.players[0].hand = [retryRed]; retry.players[1].hand = [retryGreen]; retry.beginContest(0, retryRed.uid); retry.respondContest(1, retryGreen.uid);
  const declined = retry.resolvePaymentChoice(0, false); assert.equal(declined.damage, 3); assert.equal(retry.commitDamage(declined.damageEvent), 3); assert.equal(retry.players[0].hp, 17);
});
test("秧秧 Lv.2 面对费用不足的红色对抗会直接产生 3 点待结算伤害", () => {
  const game = start();
  game.players[1].activeHero = 1;
  game.players[1].heroes[1].stack.push({ text: "【领队】【对抗】对方以红色卡对抗时，对方可以支付1点费用，若未支付，对方受到3点伤害。" });
  const red = card(game, { tone: "blaze", attack: 1 }); const green = card(game, { tone: "gale" });
  game.players[0].hand = [red]; game.players[1].hand = [green];
  game.beginContest(0, red.uid); const result = game.respondContest(1, green.uid);
  const effect = result.effects.find((item) => item.playerIndex === 1 && item.damageEvents.some((event) => event.amount === 3));
  assert.ok(effect);
  assert.equal(game.commitDamage(effect.damageEvents[0]), 3);
  assert.equal(game.players[0].hp, 17);
});
test("对局快照可恢复角色、资源、手牌与无限连击状态", () => {
  const game = start(); const held = card(game, { name: "存档手牌", tone: "blaze" });
  game.players[0].hand = [held]; energy(game, 0, 2); game.players[0].activeHero = 1; game.pursuit = { playerIndex: 0, originPlayer: 0, remaining: Infinity, source: "red" }; game.phase = "pursuit";
  const snapshot = game.snapshot(); const restored = new DuelGame({ seed: 9 });
  assert.equal(restored.loadSnapshot(snapshot).ok, true);
  assert.equal(restored.players[0].hand[0].name, "存档手牌"); assert.equal(restored.players[0].energy, 2); assert.equal(restored.players[0].activeHero, 1); assert.equal(restored.pursuit.remaining, Infinity);
});

test("卡牌测试场可为每张行动卡自动配置可用领队与费用", () => {
  const maleLeaders = new Set(["rover", "jinhsi", "sanhua"]);
  for (const template of catalog.cards.filter((card) => card.type === "action")) {
    const game = new DuelGame({
      seed: 100,
      firstPlayer: 0,
      playerPreset: maleLeaders.has(template.leaderOnly) ? "rover-male-jinhsi-sanhua" : "rover-female-yangyang-chixia",
      aiPreset: "rover-male-jinhsi-sanhua",
    });
    game.confirmSetup(0);
    if (template.leaderOnly) {
      const heroIndex = game.players[0].heroes.findIndex((hero) => hero.id === template.leaderOnly);
      assert.notEqual(heroIndex, -1, `${template.name} 缺少测试领队`);
      game.players[0].activeHero = heroIndex;
    }
    const action = game.makeCard(template);
    game.players[0].hand = [action];
    energy(game, 0, 8);
    assert.ok(game.legalContestCards(0).some((card) => card.uid === action.uid), `${template.name} 未能进入测试场`);
  }
});
