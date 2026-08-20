const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { DuelGame, HEROES, RULESET_VERSION } = require("../mobile/core.js");
const catalog = require("../mobile/card-library/catalog.js");
const presets = require("../mobile/card-library/presets.js").presets;

function start() {
  const game = new DuelGame({ seed: 42, firstPlayer: 0, playerPreset: "rover-male-jinhsi-sanhua", aiPreset: "rover-female-yangyang-chixia" });
  assert.equal(game.confirmSetup(0).started, true);
  return game;
}

function card(game, values) {
  return game.makeCard(Object.assign({ name: "测试卡", kind: "attack", tone: "blaze", cost: 0, attack: 1, speed: 1, text: "" }, values));
}

test("手机版自组构筑按单张角色卡校验，并限制未选角色的专属行动卡", () => {
  const source = presets["rover-male-jinhsi-sanhua"];
  const valid = {
    id: "custom-single-role-card-rule",
    name: "单张角色构筑",
    heroIds: ["rover", "jinhsi", "sanhua"],
    roleCards: ["BP01-021", "BP01-030", "BP01-033"],
    actions: source.actions.map(([id, count]) => [id, count]),
  };
  const game = new DuelGame({ seed: 5, firstPlayer: 0, playerPresetData: valid, aiPreset: "rover-female-yangyang-chixia" });
  assert.equal(game.players[0].roleDeck.length, 0);
  assert.throws(() => new DuelGame({ seed: 6, playerPresetData: { ...valid, roleCards: ["BP01-021", "BP01-030", "BP01-033", "BP01-021"] }, aiPreset: "rover-female-yangyang-chixia" }), /角色卡组构筑规则/);
  const invalidActions = valid.actions.map(([id, count]) => [id, count]);
  invalidActions[0] = ["SD01-010", invalidActions[0][1]];
  assert.throws(() => new DuelGame({ seed: 7, playerPresetData: { ...valid, actions: invalidActions }, aiPreset: "rover-female-yangyang-chixia" }), /行动卡组构筑规则/);
});

test("手机版 v2 规则识别60卡牌库与椿角色", () => {
  assert.equal(RULESET_VERSION, "2026-08-20-pvp-v2-60cards");
  assert.equal(catalog.cards.length, 60);
  assert.equal(new Set(catalog.cards.map((item) => item.id)).size, 60);
  assert.equal(catalog.cards.filter((item) => item.type === "action").length, 34);
  assert.equal(catalog.cards.filter((item) => item.type === "character").length, 26);
  assert.equal(HEROES.camellya.name, "椿");
});

test("手机版实现炽霞、啾啾斗意和朔风旋涌的卡面效果，并输出展示触发事件", () => {
  const game = start();
  game.players[0].activeHero = 2;
  game.players[0].heroes[2].id = "chixia";
  game.players[0].heroes[2].name = "炽霞";
  game.players[0].heroes[2].stack.push({ text: "己方拥有【领队技】的「炽霞」卡伤害+3。" });
  assert.equal(game.cardStats(0, card(game, { id: "SD01-011", leaderOnly: "chixia", attack: 7 })).attack, 10);

  const returnCard = card(game, { id: "SD01-010", leaderOnly: "chixia", tone: "blaze", attack: 2, speed: 8, text: "【判定】若己方以此卡对抗蓝色卡失败，己方可以将此卡加入手牌。" });
  const blue = card(game, { tone: "tide", kind: "dodge" });
  game.players[0].hand = [returnCard];
  game.players[1].hand = [blue];
  const contest = game.beginContest(0, returnCard.uid);
  assert.equal(contest.ok, true);
  const result = game.respondContest(1, blue.uid);
  const returnEffect = result.effects.find((effect) => effect.deferred?.some((operation) => operation.type === "action-zone-to-hand"));
  assert.ok(returnEffect.deferred.some((operation) => operation.type === "action-zone-to-hand"));
  game.commitDeferredEffect(returnEffect);
  assert.ok(game.players[0].hand.some((item) => item.uid === returnCard.uid));

  const effect = game.triggerJudgementEffects(0, card(game, { id: "SD01-016", tone: "blaze", text: "【判定】若己方胜利，下个回合中，对方的红色卡费用+1。" }), blue, true);
  assert.equal(effect.redCardCostIncreaseNextTurn, true);
  assert.ok(effect.triggers.some((trigger) => trigger.detail.includes("费用 +1")));
  game.commitDeferredEffect(effect);
  game.startTurn(1, false);
  assert.equal(game.cardCost(1, card(game, { tone: "blaze", cost: 2 })), 3);
  assert.equal(game.cardCost(1, card(game, { tone: "tide", cost: 2 })), 2);
});

test("手机版在任一方回合结束时结算所有角色的回合结束技能，并携带动画事件", () => {
  const game = start();
  game.players[0].heroes[0].stack.push({ name: "漂泊者（男）", text: "【领队】【各回合结束时】抽1张卡。" });
  const before = game.players[0].hand.length;
  game.startTurn(1, false);
  const ended = game.finishTurn(1);
  assert.equal(game.players[0].hand.length, before + 2);
  game.commitDeferredEffect(ended.turnEndEffects[0]);
  assert.equal(game.players[0].hand.length, before + 3);
  assert.equal(ended.turnEndEffects.length, 1);
  assert.equal(ended.turnEndEffects[0].playerIndex, 0);
  assert.equal(ended.turnEndEffects[0].cardName, "漂泊者（男）");
});

test("女漂泊者 Lv.2 先结算回合开始技能抽牌，再进行本回合常规抽牌", () => {
  const game = new DuelGame({ seed: 17, firstPlayer: 0, playerPreset: "rover-female-yangyang-chixia", aiPreset: "rover-male-jinhsi-sanhua" });
  const rover = game.players[0].heroes[0];
  rover.stack.push({ id: "SD01-001", name: "漂泊者（女）", level: 2, text: "【己方回合开始时】抽1张卡。" });
  rover.level = 2;
  const normalSecond = card(game, { name: "常规抽牌二" });
  const normalFirst = card(game, { name: "常规抽牌一" });
  const skillDraw = card(game, { name: "角色技能抽牌" });
  game.players[0].hand = [];
  game.players[0].deck = [normalSecond, normalFirst, skillDraw];

  game.startTurn(0, false);

  assert.deepEqual(game.players[0].hand.map((item) => item.name), []);
  assert.equal(game.phase, "turn-start");
  assert.equal(game.lastTurnStartEffects.effects.length, 1);
  assert.equal(game.lastTurnStartEffects.effects[0].draw, 1);
  assert.equal(game.lastTurnStartEffects.effects[0].cardName, "漂泊者（女）");
  game.commitDeferredEffect(game.lastTurnStartEffects.effects[0]);
  assert.deepEqual(game.players[0].hand.map((item) => item.name), ["角色技能抽牌", "常规抽牌一", "常规抽牌二"]);
  assert.equal(game.lastTurnDraw.count, 2);
  assert.equal(game.lastTurnDraw.pending, false);
  assert.equal(game.snapshot().lastTurnStartEffects.effects[0].timing, "己方回合开始时");
});

test("弃牌区选牌由权威延迟队列校验，可恢复且重复提交幂等", () => {
  const game = start();
  const normal = card(game, { name: "普攻", actionType: "常态攻击" });
  const utility = card(game, { name: "非普攻", actionType: "共鸣技能" });
  game.players[0].discard = [normal, utility];
  const trigger = game.roleTrigger({ name: "炽霞" }, 0, "升级");
  const operation = game.defer(trigger, "discard-normal-to-hand", { count: 1, choiceRequired: true, optional: true });
  const saved = game.snapshot();
  const restored = new DuelGame({ seed: 1, multiplayer: true });
  assert.equal(restored.loadSnapshot(saved).ok, true);
  const pending = restored.pendingDeferredEffects[0];
  const pendingOperation = pending.deferred[0];
  assert.equal(restored.resolveDeferredChoice(1, pending.effectId, pendingOperation.operationId, normal.uid).ok, false);
  assert.equal(restored.resolveDeferredChoice(0, pending.effectId, pendingOperation.operationId, utility.uid).ok, false);
  assert.equal(restored.resolveDeferredChoice(0, pending.effectId, pendingOperation.operationId, normal.uid).ok, true);
  const committed = restored.commitPendingDeferredEffect(0, pending.effectId);
  assert.equal(committed.ok, true);
  assert.equal(committed.committed[0].cards[0].uid, normal.uid);
  assert.ok(restored.players[0].hand.some((item) => item.uid === normal.uid));
  const handCount = restored.players[0].hand.length;
  assert.deepEqual(restored.commitDeferredEffect(pending.effectId), []);
  assert.equal(restored.players[0].hand.length, handCount);
  assert.equal(restored.pendingDeferredEffects.length, 0);
  assert.equal(operation.effectId, trigger.effectId);
});

test("可选延迟效果可主动跳过，必选效果不允许空选", () => {
  const game = start();
  const optional = game.roleTrigger({ name: "椿" }, 0, "判定");
  const optionalOperation = game.defer(optional, "discard-normal-to-hand", { count: 1, choiceRequired: true, optional: true });
  assert.equal(game.resolveDeferredChoice(0, optional.effectId, optionalOperation.operationId, null).ok, true);
  assert.equal(game.commitPendingDeferredEffect(0, optional.effectId).ok, true);
  const required = game.roleTrigger({ name: "散华" }, 0, "升级");
  const requiredOperation = game.defer(required, "discard-to-charge", { count: 1, choiceRequired: true, optional: false });
  assert.equal(game.resolveDeferredChoice(0, required.effectId, requiredOperation.operationId, null).ok, false);
  assert.equal(game.commitPendingDeferredEffect(0, required.effectId).ok, false);
});

test("椿每回合第二次受伤减1且切回合重置计数", () => {
  const game = start();
  const player = game.players[0];
  player.heroes[0].id = "camellya";
  player.heroes[0].name = "椿";
  player.heroes[0].stack.push({ text: "每回合受到的第二次伤害-1。" });
  assert.equal(game.damage(0, 3, "第一次"), 3);
  assert.equal(game.damage(0, 3, "第二次"), 2);
  game.startTurn(1, false);
  assert.equal(player.damageInstancesThisTurn, 0);
  assert.equal(game.damage(0, 3, "新回合第一次"), 3);
});

test("联机快照严格校验规则版本，旧单机存档仍可兼容", () => {
  const multiplayer = new DuelGame({ seed: 8, multiplayer: true });
  const stale = multiplayer.snapshot();
  stale.rulesetVersion = "legacy-rules";
  assert.equal(new DuelGame({ seed: 9, multiplayer: true }).loadSnapshot(stale).ok, false);
  stale.multiplayer = false;
  assert.equal(new DuelGame({ seed: 9 }).loadSnapshot(stale).ok, true);
});

test("手机版回合切换、角色效果和追击按钮提示使用同一顺序化展示流程", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "mobile", "game.js"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "..", "mobile", "styles.css"), "utf8");
  const sequence = source.slice(source.indexOf("async function animateTurnSequence"), source.indexOf("function queueTurnSequenceAnimation"));
  assert.ok(sequence.indexOf("animateTurnTransition") < sequence.indexOf("animateAndCommitDeferredEffect"));
  assert.ok(sequence.indexOf("animateAndCommitDeferredEffect") < sequence.indexOf("角色技能抽牌"));
  assert.ok(sequence.indexOf("角色技能抽牌") < sequence.indexOf("animateTurnDraw"));
  assert.match(source, /elements\.play\.classList\.toggle\("pursuit-attention", remindPursuit\)/);
  assert.match(source, /elements\.endTurn\.classList\.toggle\("pursuit-attention", remindStopPursuit\)/);
  assert.match(source, /const remindPursuit = pursuing && legalPursuitCards\.length > 0/);
  assert.match(source, /const remindStopPursuit = pursuing && legalPursuitCards\.length === 0/);
  assert.match(source, /const playerPursuit = game\.phase === "pursuit" && game\.pursuit\?\.playerIndex === 0/);
  assert.match(source, /playerPursuit \? "停止追击" : "结束回合"/);
  assert.match(source, /tutorialRenderStep === "pursuit"\) elements\.endTurn\.classList\.add\("tutorial-focus-layer"\)/);
  assert.match(source, /sendPvpCommand\("resolve_deferred_effect"/);
  assert.match(source, /dataset\.utilityMode = "discard-recovery"/);
  assert.match(css, /#responseOverlay\[data-utility-mode="discard-recovery"\]/);
  assert.doesNotMatch(source, /pursuitActionTaken/);
  assert.match(source, /turn-transition-frame\.png/);
  assert.match(source, /turn-transition-opponent\.png/);
  assert.match(source, /<img class="turn-transition-image"/);
  assert.doesNotMatch(source, /turn-transition-copy/);
  assert.doesNotMatch(css, /turn-transition-copy/);
  assert.match(css, /primary-actions button\.pursuit-attention/);
  assert.equal(fs.existsSync(path.join(__dirname, "..", "mobile", "assets", "backgrounds", "turn-transition-frame.png")), true);
  assert.equal(fs.existsSync(path.join(__dirname, "..", "mobile", "assets", "backgrounds", "turn-transition-opponent.png")), true);
});

test("手机版首页移除全屏游玩入口并保持横屏预览紧凑布局", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "mobile", "index.html"), "utf8");
  const source = fs.readFileSync(path.join(__dirname, "..", "mobile", "game.js"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "..", "mobile", "styles.css"), "utf8");
  assert.doesNotMatch(html, /fullscreenButton|全屏游玩/);
  assert.doesNotMatch(source, /toggleFullscreen|requestFullscreen|webkitRequestFullscreen/);
  assert.match(css, /html\.desktop-mobile-preview \.menu-cover-eyebrow/);
  assert.match(css, /html\.desktop-mobile-preview \.menu-cover-actions/);
});

test("手机版设置提供自动推荐与三种主流横屏适配档位", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "mobile", "index.html"), "utf8");
  const source = fs.readFileSync(path.join(__dirname, "..", "mobile", "game.js"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "..", "mobile", "styles.css"), "utf8");
  assert.match(html, /name="screenProfile" value="auto"/);
  assert.match(html, /value="classic"[\s\S]*?736 × 414/);
  assert.match(html, /value="standard"[\s\S]*?852 × 393/);
  assert.match(html, /value="wide"[\s\S]*?915 × 412/);
  assert.match(source, /waves-duel-screen-profile-v1/);
  assert.match(source, /function closestScreenProfile\(\)/);
  assert.match(source, /root\.dataset\.screenProfile = resolved/);
  assert.match(source, /localStorage\.setItem\(SCREEN_PROFILE_KEY, normalized\)/);
  assert.match(css, /html\[data-screen-profile="classic"\]/);
  assert.match(css, /html\[data-screen-profile="wide"\]/);
  assert.match(css, /var\(--mobile-action-width\)/);
});

test("手机版所有卡牌详情入口展示角色与行动牌的补充属性", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "mobile", "game.js"), "utf8");
  for (const label of ["武器：", "共鸣属性：", "地区：", "行动类别：", "子类别：", "绑定角色："]) assert.match(source, new RegExp(label));
  assert.match(source, /function cardSupplementalAttributeText\(card\)/);
  assert.match(source, /\["武器", card\.type === "character" \? card\.weapon : null\]/);
  assert.match(source, /\["行动类别", card\.type === "action" \? card\.actionType : null\]/);
  assert.match(source, /const facts = \[baseFacts, cardSupplementalAttributeText\(card\)\]/);
  assert.match(source, /const attributes = cardSupplementalAttributeText\(selected\)/);
  assert.match(source, /const attributes = cardSupplementalAttributeText\(hero\.stack\[hero\.stack\.length - 1\]\)/);
  assert.match(source, /const attributes = cardSupplementalAttributeText\(sourceCard\)/);
});

test("AI 红牌响应获胜后先结算本轮效果，再逐次追击，停止后由原回合方结束回合", () => {
  const game = start();
  const playerCard = card(game, { name: "蟠龙清辉", tone: "gale", attack: 0 });
  const aiCard = card(game, { name: "浮光雾寒·普攻", tone: "blaze", attack: 1 });
  const pursuitOne = card(game, { name: "追击一", tone: "blaze", attack: 1 });
  const pursuitTwo = card(game, { name: "追击二", tone: "blaze", attack: 1 });
  game.players[0].hand = [playerCard];
  game.players[1].hand = [aiCard, pursuitOne, pursuitTwo];

  assert.equal(game.beginContest(0, playerCard.uid).ok, true);
  const contest = game.respondContest(1, aiCard.uid);
  for (const effect of contest.effects) {
    for (const event of effect.damageEvents || []) game.commitDamage(event);
  }
  assert.equal(game.phase, "pursuit");
  assert.equal(game.pursuit.playerIndex, 1);
  assert.equal(game.pursuit.originPlayer, 0);

  const first = game.playCombo(1, pursuitOne.uid);
  for (const event of first.effect.damageEvents) game.commitDamage(event);
  assert.equal(game.phase, "pursuit");
  const second = game.playCombo(1, pursuitTwo.uid);
  for (const event of second.effect.damageEvents) game.commitDamage(event);
  assert.equal(game.phase, "pursuit");

  const stopped = game.endPursuit(1);
  assert.equal(stopped.ok, true);
  assert.equal(game.phase, "post-battle");
  assert.equal(game.activePlayer, 0);
  assert.equal(game.endTurn(0).ok, true);
  assert.equal(game.activePlayer, 1);
  assert.equal(game.phase, "main");
});

test("手机版所有对抗入口共用异常解锁与追击续跑看门狗", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "mobile", "game.js"), "utf8");
  assert.match(source, /async function resolveContestPresentation\(result, options = \{\}\)/);
  assert.match(source, /AUTO_RESOLUTION_IDLE_WATCHDOG_MS = 12_000/);
  assert.match(source, /AUTO_RESOLUTION_HARD_WATCHDOG_MS = 35_000/);
  assert.match(source, /finally \{[\s\S]*?aiRunning = false;[\s\S]*?uiLocked = false;/);
  assert.match(source, /Contest resolution watchdog resumed AI scheduling/);
  assert.equal((source.match(/await resolveContestPresentation\(result/g) || []).length, 4);
  assert.match(source, /respond_contest"\) await resolveContestPresentation\(event, \{ authoritativeStateApplied: true \}\)/);
  assert.match(source, /resolveContestPresentation\(result,\{authoritativeStateApplied:true\}\)/);
});
