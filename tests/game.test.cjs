const test = require("node:test");
const assert = require("node:assert/strict");
const { DuelGame, TONES } = require("../demo/core.js");
const catalog = require("../demo/card-library/catalog.js");

function start() {
  const game = new DuelGame({ seed: 42, firstPlayer: 0, playerPreset: "rover-male-jinhsi-sanhua", aiPreset: "rover-female-yangyang-chixia" });
  assert.equal(game.confirmSetup(0).started, true);
  return game;
}
function card(game, values) { return game.makeCard(Object.assign({ name: "测试卡", kind: "attack", tone: "blaze", cost: 0, attack: 1, speed: 1, text: "" }, values)); }
function energy(game, index, count) { const p = game.players[index]; p.chargeZone = Array.from({ length: count }, (_, i) => card(game, { name: `协奏${i}`, tone: "tide", kind: "dodge" })); p.energy = count; }

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

test("回合开始与结束的角色触发按卡面时机抽牌", () => {
  const game = start();
  const player = game.players[0];
  player.heroes[0].stack.push({ text: "【各回合结束时】抽1张卡。" });
  const beforeEnd = player.hand.length;
  game.triggerTurnEnd(0);
  assert.equal(player.hand.length, beforeEnd + 1);
  player.heroes[0].stack.push({ text: "【己方回合开始时】抽1张卡。" });
  const beforeStart = player.hand.length;
  game.triggerTurnStart(0);
  assert.equal(player.hand.length, beforeStart + 1);
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

test("移岁迷邪在行动区达到三张时仅连击额外造成三点伤害", () => {
  const game = start();
  const player = game.players[0];
  const migui = card(game, { name: "移岁迷邪", text: "【连击】若己方行动区有3张或以上的卡，此卡伤害+3。", attack: 5 });
  player.actionZone = [card(game, {}), card(game, {}), migui];
  assert.equal(game.comboDamageBonus(0, migui, false), 0);
  assert.equal(game.comboDamageBonus(0, migui, true), 3);
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
