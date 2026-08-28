const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { DuelGame, RULESET_VERSION, validatePresetConstruction } = require("../mobile/core.js");

test("多人构造不会替第二位玩家自动选择领队或确认准备", () => {
  const game = new DuelGame({ seed: 41, multiplayer: true });
  assert.equal(game.multiplayer, true);
  assert.equal(game.players[0].setupConfirmed, false);
  assert.equal(game.players[1].setupConfirmed, false);
  assert.equal(game.players[1].mulliganUsed, false);
  assert.equal(typeof RULESET_VERSION, "string");
  assert.equal(validatePresetConstruction(require("../mobile/card-library/presets.js").presets["rover-male-jinhsi-sanhua"]), true);
});

test("抛硬币获胜方可在确认准备前修改先后手，确认后锁定", () => {
  const game = new DuelGame({ seed: 42, multiplayer: true });
  const chooser = game.coinWinner;
  const other = 1 - chooser;
  assert.equal(game.chooseInitiative(other, other).ok, false);
  assert.equal(game.chooseInitiative(chooser, chooser).ok, true);
  assert.equal(game.firstPlayer, chooser);
  assert.equal(game.chooseInitiative(chooser, other).ok, true);
  assert.equal(game.firstPlayer, other);
  game.chooseLeader(chooser, 0);
  assert.equal(game.confirmSetup(chooser).ok, true);
  assert.equal(game.chooseInitiative(chooser, chooser).ok, false);
  assert.equal(game.firstPlayer, other);
});

test("决定方切换先后手后，另一方投影视图同步显示相反顺序", async () => {
  const { projectState } = await import("../supabase/functions/_shared/pvp-state.mjs");
  const game = new DuelGame({ seed: 42, multiplayer: true });
  const chooser = game.coinWinner;
  const other = 1 - chooser;
  assert.equal(game.chooseInitiative(chooser, chooser).ok, true);
  let chooserView = projectState(game.snapshot(), chooser);
  let otherView = projectState(game.snapshot(), other);
  assert.equal(chooserView.coinWinner, 0);
  assert.equal(chooserView.firstPlayer, 0);
  assert.equal(otherView.coinWinner, 1);
  assert.equal(otherView.firstPlayer, 1);
  assert.equal(game.chooseInitiative(chooser, other).ok, true);
  chooserView = projectState(game.snapshot(), chooser);
  otherView = projectState(game.snapshot(), other);
  assert.equal(chooserView.firstPlayer, 1);
  assert.equal(otherView.firstPlayer, 0);
});

test("手机版在线卡库使用体积优化的 WebP，原 PNG 保留", () => {
  const mobileCatalog = require("../mobile/card-library/catalog.js");
  const root = path.join(__dirname, "..", "mobile", "card-library");
  let webpBytes = 0;
  let pngBytes = 0;
  for (const card of mobileCatalog.cards) {
    assert.match(card.art, /\.webp$/);
    const webp = path.join(root, card.art);
    const png = webp.replace(/\.webp$/i, ".png");
    assert.ok(fs.existsSync(webp), `${card.id} 的 WebP 缺失`);
    assert.ok(fs.existsSync(png), `${card.id} 的原 PNG 缺失`);
    webpBytes += fs.statSync(webp).size;
    pngBytes += fs.statSync(png).size;
  }
  assert.ok(webpBytes < pngBytes * 0.2, `WebP 体积未达到预期：${webpBytes}/${pngBytes}`);
});

test("快照恢复随机状态后继续洗牌得到完全相同结果", () => {
  const original = new DuelGame({ seed: 90210, multiplayer: true });
  original.random(); original.random();
  const snapshot = original.snapshot();
  const restored = new DuelGame({ seed: 1, multiplayer: true });
  assert.equal(restored.loadSnapshot(snapshot).ok, true);
  const left = [1,2,3,4,5,6,7,8,9], right = [...left];
  original.shuffle(left); restored.shuffle(right);
  assert.deepEqual(right, left);
  assert.equal(restored.snapshot().rngState, original.snapshot().rngState);
});

test("双方视图均隐藏对手手牌、牌库、角色牌库和暗置角色", async () => {
  const { projectState } = await import("../supabase/functions/_shared/pvp-state.mjs");
  const game = new DuelGame({ seed: 7, multiplayer: true });
  const snapshot = game.snapshot();
  const view0 = projectState(snapshot, 0), view1 = projectState(snapshot, 1);
  assert.equal(view0.players[0].hand[0].hidden, undefined);
  assert.equal(view0.players[1].hand[0].hidden, true);
  assert.ok(view0.players[0].deck.every((card) => card.hidden));
  assert.ok(view0.players[1].roleDeck.every((card) => card.hidden));
  assert.ok(view0.players[1].heroes.every((hero) => hero.hidden));
  assert.equal(view1.selfSeat, 0);
  assert.equal(view1.players[0].hand[0].hidden, undefined);
  assert.equal(view1.players[1].hand[0].hidden, true);
  assert.equal(view1.players[0].name, snapshot.players[1].name);
  assert.equal(view1.players[1].name, snapshot.players[0].name);
  assert.notEqual(JSON.stringify(view0), JSON.stringify(snapshot));
});

test("响应阶段不会通过行动区、费用或预组编号泄露暗置行动卡", async () => {
  const { projectState } = await import("../supabase/functions/_shared/pvp-state.mjs");
  const game = new DuelGame({ seed: 17, multiplayer: true, firstPlayer: 0 });
  game.confirmSetup(0); game.confirmSetup(1);
  const hiddenCard = game.players[0].hand.find((card) => !game.isComboCard(card));
  assert.ok(hiddenCard, "起手牌中应存在可用于普通对抗的非连击牌");
  game.players[0].energy = 20;
  game.players[0].chargeZone = Array.from({ length: 20 }, (_value,index) => ({ uid:`energy-${index}` }));
  assert.equal(game.beginContest(0, hiddenCard.uid).ok, true);
  const opponentView = projectState(game.snapshot(), 1);
  assert.deepEqual(opponentView.players[1].actionZone[0], { uid:hiddenCard.uid, facedown:true, hidden:true });
  assert.equal(opponentView.players[1].presetId, undefined);
  assert.equal(opponentView.players[1].presetName, undefined);
  assert.equal(opponentView.pending.initiator, 1);
  assert.equal(opponentView.pending.responder, 0);
  assert.equal(opponentView.pending.initiatorCard.hidden, true);
  assert.equal(opponentView.pending.initiatorCost, undefined);
  assert.doesNotMatch(JSON.stringify(opponentView), new RegExp(`"uid":"${hiddenCard.uid}"[^}]*"name"`));
});

test("权威延迟效果只向拥有者暴露选牌信息", async () => {
  const { projectState } = await import("../supabase/functions/_shared/pvp-state.mjs");
  const game = new DuelGame({ seed: 27, multiplayer: true });
  const source = { id:"test-role", name:"测试角色", text:"【升级】可以将弃牌区1张卡置于协奏区。" };
  const effect = game.roleTrigger(source, 0, "升级");
  game.defer(effect, "discard-to-charge", { count:1, choiceRequired:true, optional:true, candidates:[{ uid:"private-candidate", name:"不应公开" }] });
  effect.deferred[0].selectedUid = "private-selection";
  const ownerView = projectState(game.snapshot(), 0);
  const opponentView = projectState(game.snapshot(), 1);
  assert.equal(ownerView.pendingDeferredEffects[0].deferred[0].selectedUid, "private-selection");
  assert.equal(opponentView.pendingDeferredEffects[0].playerIndex, 1);
  assert.equal(opponentView.pendingDeferredEffects[0].deferred[0].selectedUid, undefined);
  assert.equal(opponentView.pendingDeferredEffects[0].deferred[0].candidates, undefined);
  assert.doesNotMatch(JSON.stringify(opponentView), /private-candidate|private-selection|不应公开/);
});

test("延迟结算事件不会向对手泄露加入手牌的卡", async () => {
  const { sanitizeEvent } = await import("../supabase/functions/_shared/pvp-state.mjs");
  const result = { ok:true, actorSeat:0, commandType:"resolve_deferred_effect", committed:[{ playerIndex:0, type:"draw", destination:"hand", cards:[{ uid:"secret-card", name:"秘密手牌" }] }] };
  const ownEvent = sanitizeEvent(result, 0);
  const opponentEvent = sanitizeEvent(result, 1);
  assert.equal(ownEvent.committed[0].cards[0].name, "秘密手牌");
  assert.deepEqual(opponentEvent.committed[0].cards, [{ hidden:true }]);
  assert.doesNotMatch(JSON.stringify(opponentEvent), /secret-card|秘密手牌/);
});

test("PVP函数接入新版规则、延迟效果命令和旧对局拒绝", () => {
  const root = path.join(__dirname, "..");
  const core = fs.readFileSync(path.join(root, "mobile", "core.js"), "utf8");
  const edge = fs.readFileSync(path.join(root, "supabase", "functions", "pvp", "index.ts"), "utf8");
  assert.match(core, /RULESET_VERSION\s*=\s*"2026-08-28-pvp-v6-73cards-camellya-reupgrade"/);
  assert.match(edge, /resolve_deferred_effect:\s*\(\)\s*=>\s*resolveDeferredEffect/);
  assert.match(edge, /match\.ruleset_version[\s\S]{0,260}match\.state\?\.rulesetVersion/);
  assert.match(edge, /game\.resolveDeferredEffect\(seat, effectId, choices\)/);
  assert.match(edge, /operation === "leave"/);
  assert.match(edge, /format: "pvp-receipt-v2", event: result, snapshot/);
  assert.match(edge, /pvp_action_receipts[\s\S]{0,260}gt\("version", sinceVersion\)[\s\S]{0,180}order\("version"/);
});

test("空房离开由服务端确认，失败时保留会话供重试", () => {
  const root = path.join(__dirname, "..");
  const lobby = fs.readFileSync(path.join(root, "mobile", "pvp.js"), "utf8");
  const edge = fs.readFileSync(path.join(root, "supabase", "functions", "pvp", "index.ts"), "utf8");
  const leave = lobby.slice(lobby.indexOf("async function leaveRoom"), lobby.indexOf("async function claimTimeout"));
  assert.match(leave, /await api\("leave", \{ roomId:session\.roomId \}\)/);
  assert.match(leave, /clearSession\(\)[\s\S]{0,80}location\.href/);
  assert.match(leave, /离开失败：[\s\S]+请检查网络后重试/);
  assert.doesNotMatch(leave, /finally[\s\S]{0,200}clearSession/);
  assert.match(edge, /room\.host_user_id === userId \|\| \(count \|\| 0\) <= 1[\s\S]{0,220}pvp_rooms"\)\.delete/);
  assert.match(edge, /strandedRooms[\s\S]{0,500}\(count \|\| 0\) <= 1[\s\S]{0,180}pvp_rooms"\)\.delete/);
});

test("网络跨版本时严格按事件版本串行动画后再应用状态", async () => {
  const source = fs.readFileSync(path.join(__dirname, "../mobile/pvp-game.js"), "utf8");
  const roomId = "room-order-test";
  const sessionKey = "waves-duel-pvp-session-v1";
  const cacheKey = `waves-duel-pvp-view-v2:${roomId}`;
  const storage = new Map([
    [sessionKey, JSON.stringify({ roomId, seat:0 })],
    [cacheKey, JSON.stringify({ version:1, view:{ players:[{ name:"我" },{ name:"敌" }] } })],
  ]);
  const order = [];
  const channel = { on(){ return this; }, subscribe(){ return this; } };
  const client = {
    auth:{ getSession:async()=>({ data:{ session:{ access_token:"test" } } }) },
    channel:()=>channel,
    removeChannel:async()=>{},
  };
  const payload = {
    ok:true,
    room:{ status:"in_game" },
    view:{ version:3, view:{ players:[{ step:3 },{ step:3 }] } },
    events:[
      { version:3, event:{ commandType:"charge", actorSeat:1, marker:3 }, view:{ players:[{ step:3 },{ step:3 }] } },
      { version:2, event:{ commandType:"switch_hero", actorSeat:1, marker:2 }, view:{ players:[{ step:2 },{ step:2 }] } },
    ],
    hasMore:false,
  };
  const context = {
    window:{ WavesDuelPvpConfig:{ supabaseUrl:"https://example.supabase.co", supabasePublishableKey:"public" }, supabase:{ createClient:()=>client } },
    localStorage:{ getItem:(key)=>storage.get(key)||null, setItem:(key,value)=>storage.set(key,String(value)), removeItem:(key)=>storage.delete(key) },
    location:{ replace:()=>{} },
    fetch:async()=>({ ok:true, status:200, json:async()=>payload }),
    crypto:{ randomUUID:()=>"00000000-0000-4000-8000-000000000000" },
    setInterval:()=>1,
    clearInterval:()=>{},
    console,
  };
  vm.runInNewContext(source, context, { filename:"mobile/pvp-game.js" });
  await context.window.WavesDuelPvpGame.init({
    onState:(state)=>order.push(`state-${state.view.version}`),
    onEvent:async(event)=>{ order.push(`anim-${event.marker}-start`); await Promise.resolve(); order.push(`anim-${event.marker}-end`); },
    onError:(error)=>{ throw error; },
  });
  assert.deepEqual(order, ["state-1","anim-2-start","anim-2-end","state-2","anim-3-start","anim-3-end","state-3"]);
  assert.equal(JSON.parse(storage.get(cacheKey)).version, 3);
});

test("PVP 前端只使用腾讯云同源公开配置，不包含 Supabase 或服务端密钥", () => {
  const root = path.join(__dirname, "..");
  const frontend = ["mobile/pvp.html","mobile/pvp.js","mobile/pvp-game.js","mobile/pvp-config.js"].map((file) => fs.readFileSync(path.join(root,file),"utf8")).join("\n");
  assert.doesNotMatch(frontend, /SUPABASE_SERVICE_ROLE_KEY|service[_-]?role/i);
  const config = fs.readFileSync(path.join(root,"mobile/pvp-config.js"),"utf8");
  assert.match(config, /backend:\s*"tencent-ws"/);
  assert.match(config, /supabaseUrl:\s*wavesDuelPvpOrigin/);
  assert.match(config, /supabasePublishableKey:\s*"tencent-same-origin"/);
  assert.match(config, /turnstileSiteKey:\s*""/);
  assert.doesNotMatch(config, /supabase\.co|eyJhbGci|0x4A/);
  assert.doesNotMatch(frontend, /cdn\.jsdelivr\.net\/npm\/@supabase/);
});

test("Turnstile 未完成时锁住房间按钮，并提供失败重试状态", () => {
  const root = path.join(__dirname, "..");
  const html = fs.readFileSync(path.join(root, "mobile", "pvp.html"), "utf8");
  const script = fs.readFileSync(path.join(root, "mobile", "pvp.js"), "utf8");
  assert.match(html, /id="createRoomButton"[^>]*disabled/);
  assert.match(html, /id="joinRoomButton"[^>]*disabled/);
  assert.match(html, /id="turnstileStatus"/);
  assert.match(html, /id="turnstileRetryButton"/);
  for (const callback of ["error-callback", "expired-callback", "timeout-callback", "unsupported-callback"]) assert.match(script, new RegExp(callback));
  assert.match(script, /setRoomActionsEnabled\(false\)/);
  assert.match(script, /elements\.turnstileRetry\.addEventListener\("click",retryCaptcha\)/);
  assert.match(script, /captchaEpoch/);
  assert.match(script, /const current = \(\) => epoch === captchaEpoch/);
  assert.match(script, /retry: "never"/);
  assert.match(script, /render=explicit&onload=wavesDuelTurnstileReady/);
  assert.match(script, /CAPTCHA_LOAD_TIMEOUT_MS = 15000/);
  assert.match(script, /const attempt = \+\+captchaAttempt/);
  assert.match(script, /if \(captchaWatchdog === null\) armCaptchaWatchdog\(\)/);
  assert.match(script, /attempt !== captchaAttempt/);
  assert.match(script, /人机验证响应超时，请重新加载验证/);
  assert.match(script, /"error-callback": \(code\)/);
  assert.doesNotMatch(script, /"before-interactive-callback"[^\n]+clearCaptchaWatchdog/);
  assert.match(script, /callback: \(token\)[^\n]+persistCaptchaSession\(token\)/);
  assert.match(script, /async function persistCaptchaSession\(token\)/);
  assert.match(script, /验证已通过，正在建立联机身份/);
  assert.match(script, /markCaptchaVerified\("联机身份已保存，可以创建或加入房间"\)/);
  assert.match(script, /if \(captchaAuthPromise\) await captchaAuthPromise/);
  assert.match(script, /getUser\(\)/);
  assert.match(script, /response\.status === 401 \|\| result\.error === "unauthorized"/);
});

test("PVP 开局后复用单机原战场而非第二套简化战斗页", () => {
  const root = path.join(__dirname, "..");
  const index = fs.readFileSync(path.join(root,"mobile/index.html"),"utf8");
  const lobby = fs.readFileSync(path.join(root,"mobile/pvp.js"),"utf8");
  const adapter = fs.readFileSync(path.join(root,"mobile/pvp-game.js"),"utf8");
  assert.match(index, /id="arenaContestStage"/);
  assert.match(index, /src="pvp-game\.js(?:\?v=[^"]+)?"/);
  assert.match(lobby, /index\.html\?pvp=1/);
  assert.match(adapter, /functions\/v1\/pvp/);
  assert.match(adapter, /choose_initiative[\s\S]+session\.seat/);
  assert.doesNotMatch(lobby, /renderGame\(\)/);
  const gameUi = fs.readFileSync(path.join(root,"mobile/game.js"),"utf8");
  assert.match(gameUi, /passDefense\.classList\.remove\("hidden"\)/);
  assert.match(gameUi, /initiativeDecisionHint/);
  assert.match(gameUi, /确认前可修改/);
  assert.match(adapter, /refresh\(\)\.catch\(\(\) => \{\}\)/);
  assert.match(adapter, /events = \[\.\.\.\(payload\.events \|\| \[\]\)\]\.sort/);
  assert.match(adapter, /await onEvent\?\.\(item\.event[\s\S]{0,180}applyView/);
  assert.match(adapter, /finally \{[\s\S]{0,220}applyView/);
  assert.match(adapter, /deliverEvent\(\{ version:response\.version, event:response\.result, view:response\.view \}/);
});

test("数据库只向客户端开放成员、房间和本人投影视图", () => {
  const sql = fs.readFileSync(path.join(__dirname,"../supabase/migrations/20260820090000_pvp.sql"),"utf8");
  for (const table of ["pvp_deck_submissions","pvp_matches","pvp_action_receipts"]) assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
  assert.doesNotMatch(sql, /create policy[^;]+on public\.(pvp_deck_submissions|pvp_matches|pvp_action_receipts)/is);
  assert.match(sql, /players read own projected state/);
  assert.match(sql, /user_id = \(select auth\.uid\(\)\)/);
  assert.match(sql, /stale_version/);
  assert.match(sql, /start_pvp_match/);
  assert.match(sql, /finish_pvp_room/);
  assert.match(sql, /status='in_game' for update/);
  assert.match(sql, /p_winner_seat/);
  assert.doesNotMatch(sql, /create policy "room members read (room|members)"/);
  const frontend = fs.readFileSync(path.join(__dirname,"../mobile/pvp.js"),"utf8");
  assert.doesNotMatch(frontend, /table:\s*"pvp_room_members"/);
});
