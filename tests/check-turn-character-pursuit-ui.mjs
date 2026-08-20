import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const debugUrl = process.env.WAVES_DUEL_CDP_URL || "http://127.0.0.1:9222";
const gameUrl = process.env.WAVES_DUEL_GAME_URL || "http://127.0.0.1:4178/";
const outputDir = process.env.WAVES_DUEL_UI_OUTPUT || path.resolve("output", "测试", "2026-08-20");
const mobileRoot = path.resolve("mobile");

async function startStaticServer() {
  if (process.env.WAVES_DUEL_GAME_URL) return null;
  const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".png": "image/png", ".webp": "image/webp" };
  const server = http.createServer((request, response) => {
    const requestPath = decodeURIComponent(new URL(request.url, gameUrl).pathname);
    const relative = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
    const file = path.resolve(mobileRoot, relative);
    if (!file.startsWith(`${mobileRoot}${path.sep}`) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404).end("not found");
      return;
    }
    response.writeHead(200, { "content-type": types[path.extname(file).toLowerCase()] || "application/octet-stream" });
    fs.createReadStream(file).pipe(response);
  });
  await new Promise((resolve, reject) => server.listen(4178, "127.0.0.1", resolve).once("error", reject));
  return server;
}

function requestJson(url, method = "GET") {
  return new Promise((resolve, reject) => {
    const request = http.request(url, { method }, (response) => {
      let body = "";
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => {
        try { resolve(JSON.parse(body)); } catch (error) { reject(error); }
      });
    });
    request.on("error", reject);
    request.end();
  });
}

function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  const localServer = await startStaticServer();
  const target = await requestJson(`${debugUrl}/json/new?${encodeURIComponent(gameUrl)}`, "PUT");
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let sequence = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const callback = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) callback.reject(new Error(message.error.message));
    else callback.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || "browser_evaluation_failed");
    return result.result?.value;
  };
  const screenshot = async (name) => {
    const result = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
    const file = path.join(outputDir, name);
    fs.writeFileSync(file, Buffer.from(result.data, "base64"));
    return file;
  };

  try {
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: 844, height: 390, deviceScaleFactor: 1, mobile: true, screenOrientation: { type: "landscapePrimary", angle: 90 } });
    for (let i = 0; i < 50; i += 1) {
      if (await evaluate("document.readyState !== 'loading' && !!document.querySelector('#animationLayer')")) break;
      await delay(100);
    }
    await evaluate(`(() => {
      document.documentElement.classList.add('desktop-mobile-preview', 'preview-embed');
      document.querySelector('#mainMenuOverlay')?.classList.remove('hidden');
    })()`);
    await delay(300);
    const menuLayout = JSON.parse(await evaluate(`JSON.stringify((() => {
      const rect=(selector)=>{const node=document.querySelector(selector);const box=node?.getBoundingClientRect();return box?{left:box.left,top:box.top,right:box.right,bottom:box.bottom,width:box.width,height:box.height}:null;};
      const eyebrow=rect('.menu-cover-eyebrow'), content=rect('.menu-cover-content'), actions=rect('.menu-cover-actions');
      return {viewport:[innerWidth,innerHeight],eyebrow,content,actions,fullscreenExists:!!document.querySelector('#fullscreenButton'),textClipped:!eyebrow||eyebrow.top<0||eyebrow.bottom>innerHeight,contentClipped:!content||content.top<0||content.bottom>innerHeight,actionsClipped:!actions||actions.top<0||actions.bottom>innerHeight};
    })())`));
    const menuShot = await screenshot("首页移除全屏与文字遮挡-844x390.png");
    await evaluate(`(() => {
      document.documentElement.classList.add('compact-landscape');
      document.querySelectorAll('.overlay').forEach((node) => node.classList.add('hidden'));
      document.querySelector('#mainMenuOverlay')?.classList.add('hidden');
      const layer=document.querySelector('#animationLayer');
      layer.className='animation-layer turn-transition-animation owner-0 animating';
      layer.innerHTML='<div class="turn-transition-scene owner-0" role="status" aria-label="你的回合开始，准备行动"><img class="turn-transition-image" src="assets/backgrounds/turn-transition-frame.png" alt="你的回合开始，准备行动"></div>';
    })()`);
    await delay(500);
    const turnLayout = JSON.parse(await evaluate(`JSON.stringify((() => { const box=document.querySelector('.turn-transition-scene').getBoundingClientRect(); return {left:box.left,top:box.top,right:box.right,bottom:box.bottom,width:box.width,height:box.height,viewport:[innerWidth,innerHeight],clipped:box.left<0||box.top<0||box.right>innerWidth||box.bottom>innerHeight}; })())`));
    const playerTurnShot = await screenshot("我方回合原图直用-844x390.png");

    await evaluate(`(() => {
      const layer=document.querySelector('#animationLayer');
      layer.className='animation-layer turn-transition-animation owner-1 animating';
      layer.innerHTML='<div class="turn-transition-scene owner-1" role="status" aria-label="对方回合开始，对方行动"><img class="turn-transition-image" src="assets/backgrounds/turn-transition-opponent.png" alt="对方回合开始，对方行动"></div>';
    })()`);
    await delay(500);
    const opponentTurnLayout = JSON.parse(await evaluate(`JSON.stringify((() => { const box=document.querySelector('.turn-transition-scene').getBoundingClientRect(); return {left:box.left,top:box.top,right:box.right,bottom:box.bottom,width:box.width,height:box.height,viewport:[innerWidth,innerHeight],clipped:box.left<0||box.top<0||box.right>innerWidth||box.bottom>innerHeight}; })())`));
    const opponentTurnShot = await screenshot("对方回合原图直用-844x390.png");

    await evaluate(`(() => {
      const layer=document.querySelector('#animationLayer');
      layer.className='animation-layer hero-action effect-trigger-animation animating';
      layer.innerHTML='<div class="hero-action-scene effect-trigger-scene owner-0"><p class="scene-kicker">CHARACTER SKILL</p><div class="scene-hero-art" style="--hero-art:url(card-library/art/角色牌/SD01-001.webp)"></div><h2>漂泊者（女）</h2><p>【己方回合开始时】抽 1 张卡</p></div>';
    })()`);
    await delay(500);
    const effectLayout = JSON.parse(await evaluate(`JSON.stringify((() => { const box=document.querySelector('.effect-trigger-scene').getBoundingClientRect(); return {left:box.left,top:box.top,right:box.right,bottom:box.bottom,width:box.width,height:box.height,viewport:[innerWidth,innerHeight],clipped:box.left<0||box.top<0||box.right>innerWidth||box.bottom>innerHeight}; })())`));
    const effectShot = await screenshot("女漂Lv2角色效果提示-844x390.png");

    await evaluate(`(() => {
      const layer=document.querySelector('#animationLayer'); layer.className='animation-layer hidden'; layer.innerHTML='';
      const selection=document.querySelector('#selectionPreview'); selection.classList.remove('empty');
      selection.innerHTML='<div class="preview-card"><span class="tone-tag">◉ 潮汐 // 攻击</span><h3>浮光雾寒·普攻</h3><span class="cost-line">COST 1 // 速度 7 · 攻击 0</span><p class="description">行动类别：常态攻击　｜　子类别：普攻　｜　共鸣属性：冷凝　｜　绑定角色：今汐</p><p class="description">常态攻击。</p></div>';
    })()`);
    await delay(250);
    const metadataLayout = JSON.parse(await evaluate(`JSON.stringify((() => {
      const node=document.querySelector('#selectionPreview .preview-card'),box=node?.getBoundingClientRect();
      const text=node?.textContent || '';
      return {left:box?.left,top:box?.top,right:box?.right,bottom:box?.bottom,width:box?.width,height:box?.height,viewport:[innerWidth,innerHeight],clipped:!box||box.left<0||box.top<0||box.right>innerWidth||box.bottom>innerHeight,horizontal:document.documentElement.scrollWidth>innerWidth+1,hasActionMetadata:['行动类别：常态攻击','子类别：普攻','共鸣属性：冷凝','绑定角色：今汐'].every((value)=>text.includes(value))};
    })())`));
    const metadataShot = await screenshot("行动牌完整属性详情-844x390.png");
    await evaluate(`(() => {
      const selection=document.querySelector('#selectionPreview');
      selection.innerHTML='<div class="preview-card"><span class="tone-tag">◇ 无频率 // 己方角色技能</span><h3>炽霞 · Lv.1</h3><span class="cost-line">己方已叠放 2 张角色卡 // 当前领队</span><p class="description">武器：佩枪　｜　共鸣属性：热熔　｜　地区：瑝珑</p><ul class="stack-effects"><li><b>Lv.1</b><span>【登场】【升级】可以将弃牌区1张〈常态攻击〉加入手牌。</span></li></ul></div>';
    })()`);
    await delay(250);
    const characterMetadataLayout = JSON.parse(await evaluate(`JSON.stringify((() => {
      const node=document.querySelector('#selectionPreview .preview-card'),box=node?.getBoundingClientRect();
      const text=node?.textContent || '';
      return {left:box?.left,top:box?.top,right:box?.right,bottom:box?.bottom,width:box?.width,height:box?.height,viewport:[innerWidth,innerHeight],clipped:!box||box.left<0||box.top<0||box.right>innerWidth||box.bottom>innerHeight,horizontal:document.documentElement.scrollWidth>innerWidth+1,hasCharacterMetadata:['武器：佩枪','共鸣属性：热熔','地区：瑝珑'].every((value)=>text.includes(value))};
    })())`));
    const characterMetadataShot = await screenshot("角色牌完整属性详情-844x390.png");

    const deferredChoiceLayouts = [];
    for (const [width, height] of [[844, 390], [667, 375]]) {
      await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: true, screenOrientation: { type: "landscapePrimary", angle: 90 } });
      await evaluate(`(() => {
        const animation=document.querySelector('#animationLayer'); animation.className='animation-layer hidden'; animation.innerHTML='';
        const overlay=document.querySelector('#responseOverlay'); overlay.dataset.utilityMode='discard-recovery'; overlay.classList.remove('hidden');
        document.querySelector('#responseEyebrow').textContent='DISCARD RECOVERY';
        document.querySelector('#responseTitle').textContent='「散华」：从弃牌区选择卡牌';
        document.querySelector('#responseDetail').textContent='请选择 1 张弃牌卡置入协奏区。此效果可以取消。';
        document.querySelector('#responseCards').innerHTML=Array.from({length:6},(_,index)=>'<button class="card" type="button"><strong>测试弃牌 '+(index+1)+'</strong><small>点击选择</small></button>').join('');
        document.querySelector('#responsePreview').innerHTML='<p class="eyebrow">已选择</p><h3>测试弃牌 1</h3><p>角色效果选牌预览。</p>';
        for(const id of ['confirmChoiceButton','cancelChoiceButton']){const button=document.querySelector('#'+id);button.hidden=false;button.classList.remove('hidden');}
      })()`);
      await delay(250);
      const row = JSON.parse(await evaluate(`JSON.stringify((() => {
        const rect=(selector)=>{const node=document.querySelector(selector),box=node?.getBoundingClientRect();return box?{left:box.left,top:box.top,right:box.right,bottom:box.bottom,width:box.width,height:box.height}:null;};
        const modal=rect('#responseOverlay .combat-modal'),cards=rect('#responseCards'),actions=rect('#responseOverlay .modal-choice-actions');
        const inside=(box)=>box&&box.left>=-1&&box.top>=-1&&box.right<=innerWidth+1&&box.bottom<=innerHeight+1;
        return {viewport:[innerWidth,innerHeight],modal,cards,actions,clipped:![modal,cards,actions].every(inside),horizontal:document.documentElement.scrollWidth>innerWidth+1};
      })())`));
      row.file = await screenshot(`弃牌区角色效果选牌-${width}x${height}.png`);
      deferredChoiceLayouts.push(row);
    }
    await send("Emulation.setDeviceMetricsOverride", { width: 844, height: 390, deviceScaleFactor: 1, mobile: true, screenOrientation: { type: "landscapePrimary", angle: 90 } });
    await evaluate(`(() => { const overlay=document.querySelector('#responseOverlay'); overlay.classList.add('hidden'); overlay.removeAttribute('data-utility-mode'); })()`);

    await evaluate(`(() => {
      const layer=document.querySelector('#animationLayer'); layer.className='animation-layer hidden'; layer.innerHTML='';
      const play=document.querySelector('#playButton'), end=document.querySelector('#endTurnButton');
      play.classList.add('pursuit-attention'); end.classList.remove('pursuit-attention');
      play.disabled=true; play.querySelector('b').textContent='继续红色连击'; play.querySelector('small').textContent='请选择满足费用的红色牌追击';
      end.querySelector('b').textContent='停止追击'; end.querySelector('small').textContent='也可主动停止连续攻击';
    })()`);
    await delay(300);
    const pursuitShot = await screenshot("追击按钮蓝框提示-844x390.png");

    const actionLayout = JSON.parse(await evaluate(`JSON.stringify((() => {
      const play=document.querySelector('#playButton'), end=document.querySelector('#endTurnButton');
      play.classList.remove('pursuit-attention'); end.classList.add('pursuit-attention'); play.disabled=true; end.disabled=false;
      end.querySelector('small').textContent='请点击结束本次追击';
      const box=end.getBoundingClientRect(); return {left:box.left,top:box.top,right:box.right,bottom:box.bottom,clipped:box.left<0||box.top<0||box.right>innerWidth||box.bottom>innerHeight};
    })())`));
    await delay(300);
    const stopShot = await screenshot("停止追击按钮蓝框提示-844x390.png");

    const tutorialPursuitLayout = JSON.parse(await evaluate(`JSON.stringify((() => {
      const scrim=document.querySelector('#tutorialScrim'), hint=document.querySelector('#tutorialHint');
      const hand=document.querySelector('#hand'), dock=hand.closest('.hand-dock'), end=document.querySelector('#endTurnButton');
      scrim.classList.remove('hidden'); hint.classList.remove('hidden');
      hint.innerHTML='<b>追击教学：继续连击或停止</b><span>　可选择红色牌继续追击，也可点击“停止追击”。</span>';
      hand.classList.add('tutorial-target'); dock.classList.add('tutorial-focus-layer');
      end.classList.remove('pursuit-attention'); end.classList.add('tutorial-focus-layer'); end.disabled=false;
      end.querySelector('b').textContent='停止追击'; end.querySelector('small').textContent='也可主动停止连续攻击';
      const box=end.getBoundingClientRect(), style=getComputedStyle(end);
      return {label:end.querySelector('b').textContent,className:end.className,left:box.left,top:box.top,right:box.right,bottom:box.bottom,zIndex:style.zIndex,opacity:style.opacity,clipped:box.left<0||box.top<0||box.right>innerWidth||box.bottom>innerHeight};
    })())`));
    await delay(300);
    const tutorialPursuitShot = await screenshot("追击教学停止按钮保持可见-844x390.png");

    if (menuLayout.fullscreenExists || menuLayout.textClipped || menuLayout.contentClipped || menuLayout.actionsClipped || turnLayout.clipped || opponentTurnLayout.clipped || effectLayout.clipped || metadataLayout.clipped || metadataLayout.horizontal || !metadataLayout.hasActionMetadata || characterMetadataLayout.clipped || characterMetadataLayout.horizontal || !characterMetadataLayout.hasCharacterMetadata || deferredChoiceLayouts.some((row) => row.clipped || row.horizontal) || actionLayout.clipped || tutorialPursuitLayout.clipped || tutorialPursuitLayout.label !== '停止追击' || !tutorialPursuitLayout.className.includes('tutorial-focus-layer')) throw new Error(`mobile_ui_clipped: ${JSON.stringify({ menuLayout, turnLayout, opponentTurnLayout, effectLayout, metadataLayout, characterMetadataLayout, deferredChoiceLayouts, actionLayout, tutorialPursuitLayout })}`);

    await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 720, deviceScaleFactor: 1, mobile: false });
    const playerImplementation = fs.readFileSync(playerTurnShot).toString("base64");
    const opponentImplementation = fs.readFileSync(opponentTurnShot).toString("base64");
    const playerSourceImage = fs.readFileSync(path.join(mobileRoot, "assets", "backgrounds", "turn-transition-frame.png")).toString("base64");
    const opponentSourceImage = fs.readFileSync(path.join(mobileRoot, "assets", "backgrounds", "turn-transition-opponent.png")).toString("base64");
    await evaluate(`(() => {
      document.documentElement.innerHTML='<head><meta charset="utf-8"><style>body{margin:0;background:#071111;color:#dffff7;font-family:Microsoft YaHei,sans-serif}main{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:18px}figure{margin:0}figcaption{margin-bottom:8px}img{width:100%;height:280px;object-fit:contain;background:#000}</style></head><body><main><figure><figcaption>我方附件原图</figcaption><img src="data:image/png;base64,${playerSourceImage}"></figure><figure><figcaption>我方 844×390 实现</figcaption><img src="data:image/png;base64,${playerImplementation}"></figure><figure><figcaption>对方附件原图</figcaption><img src="data:image/png;base64,${opponentSourceImage}"></figure><figure><figcaption>对方 844×390 实现</figcaption><img src="data:image/png;base64,${opponentImplementation}"></figure></main></body>';
    })()`);
    await delay(700);
    const comparisonShot = await screenshot("双方回合素材直用对比.png");
    const pursuitReferenceFile = path.join(outputDir, "停止追击缺失-用户截图.png");
    const pursuitReferenceImage = fs.readFileSync(pursuitReferenceFile).toString("base64");
    const pursuitImplementation = fs.readFileSync(tutorialPursuitShot).toString("base64");
    await evaluate(`(() => {
      document.body.innerHTML='<main><figure><figcaption>用户截图：按钮误显示为结束回合且被遮罩压暗</figcaption><img src="data:image/png;base64,${pursuitReferenceImage}" style="height:600px"></figure><figure><figcaption>修复后：停止追击始终可见</figcaption><img src="data:image/png;base64,${pursuitImplementation}" style="height:600px"></figure></main>';
    })()`);
    await delay(500);
    const pursuitComparisonShot = await screenshot("停止追击用户截图与修复对比.png");
    console.log(JSON.stringify({ menuLayout, turnLayout, opponentTurnLayout, effectLayout, metadataLayout, characterMetadataLayout, deferredChoiceLayouts, actionLayout, tutorialPursuitLayout, files: { menuShot, playerTurnShot, opponentTurnShot, effectShot, metadataShot, characterMetadataShot, pursuitShot, stopShot, tutorialPursuitShot, comparisonShot, pursuitComparisonShot } }, null, 2));
  } finally {
    socket.close();
    try { await requestJson(`${debugUrl}/json/close/${target.id}`); } catch { /* QA 标签关闭失败不覆盖结果 */ }
    if (!process.env.WAVES_DUEL_KEEP_SERVER) {
      localServer?.closeAllConnections?.();
      localServer?.close();
    } else if (localServer) console.log(`Mobile preview remains available at ${gameUrl}`);
  }
}

main().catch((error) => { console.error(error.stack || error); process.exit(1); });
