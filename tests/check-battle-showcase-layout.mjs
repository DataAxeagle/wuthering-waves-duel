import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const mobileRoot = path.resolve("mobile");
const debugUrl = process.env.WAVES_DUEL_CDP_URL || "http://127.0.0.1:9222";
const baseUrl = "http://127.0.0.1:4184/";
const outputDir = path.resolve("output/测试/2026-08-23/battle-showcase-layout");
const referencePath = process.env.WAVES_DUEL_BATTLE_SHOWCASE_REFERENCE || "C:/Users/47450/AppData/Local/Temp/codex-clipboard-0a8bdae8-cd4e-44e4-b7c8-d561529606a6.png";

function requestJson(url, method = "GET") {
  return new Promise((resolve, reject) => {
    const request = http.request(url, { method }, (response) => {
      let body = "";
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => { try { resolve(JSON.parse(body)); } catch (error) { reject(error); } });
    });
    request.on("error", reject);
    request.end();
  });
}

function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function main() {
  fs.mkdirSync(outputDir, { recursive:true });
  const types = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8", ".json":"application/json; charset=utf-8", ".png":"image/png", ".webp":"image/webp", ".mp4":"video/mp4" };
  const server = http.createServer((request, response) => {
    const relative = decodeURIComponent(new URL(request.url, baseUrl).pathname).replace(/^\/+/, "") || "index.html";
    const file = path.resolve(mobileRoot, relative);
    if (!file.startsWith(`${mobileRoot}${path.sep}`) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return response.writeHead(404).end("not found");
    response.writeHead(200, { "content-type":types[path.extname(file).toLowerCase()] || "application/octet-stream" });
    fs.createReadStream(file).pipe(response);
  });
  await new Promise((resolve, reject) => server.listen(4184, "127.0.0.1", resolve).once("error", reject));

  const target = await requestJson(`${debugUrl}/json/new?${encodeURIComponent(`${baseUrl}?ui=desktop`)}`, "PUT");
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once:true }); socket.addEventListener("error", reject, { once:true }); });
  let sequence = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const callback = pending.get(message.id); pending.delete(message.id);
    if (message.error) callback.reject(new Error(message.error.message)); else callback.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => { const id=++sequence; pending.set(id,{resolve,reject}); socket.send(JSON.stringify({id,method,params})); });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, returnByValue:true, awaitPromise:true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || "browser_evaluation_failed");
    return result.result.value;
  };
  const screenshot = async (name) => {
    const shot = await send("Page.captureScreenshot", { format:"png", fromSurface:true });
    const file = path.join(outputDir, name);
    fs.writeFileSync(file, Buffer.from(shot.data, "base64"));
    return file;
  };
  const injectShowcase = async (compact) => evaluate(`(() => {
    document.documentElement.classList.toggle('compact-landscape', ${compact});
    document.documentElement.classList.toggle('desktop-ui', ${!compact});
    document.querySelectorAll('.overlay').forEach((node)=>node.classList.add('hidden'));
    const layer=document.querySelector('#animationLayer');
    layer.className='animation-layer battle-showcase-animation animating';
    layer.innerHTML=\`<div class="battle-showcase-scene victory"><div class="battle-showcase-layout"><div class="battle-showcase-visual"><div class="battle-showcase-card"><span>无冠者</span><button class="card full-face-card" type="button" aria-label="感知"><img class="card-face-image" src="card-library/art/绿色功能/SD01-020.webp" alt="感知 卡面"></button></div></div><article class="battle-showcase-copy"><header class="battle-showcase-result"><p class="scene-kicker">BATTLE RESOLUTION</p><h2>无冠者 战斗胜利</h2><small>战斗胜利 · 效果触发</small></header><section class="battle-showcase-effect"><p class="eyebrow">卡牌效果与数值</p><h3>感知</h3><p>绿色功能 · COST 0 · 速度 5 · 攻击 0<br>行动类别：探索模块　｜　子类别：无　｜　共鸣属性：未标注　｜　绑定角色：漂泊者（男）<br>【判定】若己方胜利，抽1张卡，查看对方手牌。<br>效果按照对抗结算顺序依次执行，文字过长时仅在右侧区域内上下滚动。</p></section></article></div></div>\`;
    return true;
  })()`);
  const measure = async () => JSON.parse(await evaluate(`JSON.stringify((() => {
    const rect=(selector)=>{const node=document.querySelector(selector),box=node?.getBoundingClientRect();return box?{left:box.left,top:box.top,right:box.right,bottom:box.bottom,width:box.width,height:box.height}:null;};
    const scene=rect('.battle-showcase-scene'),layout=rect('.battle-showcase-layout'),visual=rect('.battle-showcase-visual'),card=rect('.battle-showcase-visual .card'),copy=rect('.battle-showcase-copy'),effect=rect('.battle-showcase-effect');
    const effectNode=document.querySelector('.battle-showcase-effect');
    const inside=(box)=>box&&box.left>=-1&&box.top>=-1&&box.right<=innerWidth+1&&box.bottom<=innerHeight+1;
    return {viewport:[innerWidth,innerHeight],scene,layout,visual,card,copy,effect,columns:getComputedStyle(document.querySelector('.battle-showcase-layout')).gridTemplateColumns.split(' ').filter(Boolean).length,cardObjectFit:getComputedStyle(document.querySelector('.card-face-image')).objectFit,cardRatio:card?card.width/card.height:0,effectOverflow:getComputedStyle(effectNode).overflowY,effectScrollable:effectNode.scrollHeight>=effectNode.clientHeight,sideBySide:visual&&card&&copy&&visual.right<=copy.left+1&&card.right<=copy.left+1&&card.left>=visual.left-1,clipped:![scene,layout,visual,card,copy,effect].every(inside),horizontal:document.documentElement.scrollWidth>innerWidth+1};
  })())`));

  try {
    await send("Page.enable"); await send("Runtime.enable");
    for (let index=0; index<80; index+=1) { if (await evaluate("document.readyState !== 'loading' && !!document.querySelector('#animationLayer')")) break; await delay(100); }

    await send("Emulation.setDeviceMetricsOverride", { width:1440,height:900,deviceScaleFactor:1,mobile:false });
    await injectShowcase(false); await delay(350);
    const desktop = await measure();
    const desktopShot = await screenshot("battle-showcase-desktop-1440x900.png");

    await send("Emulation.setDeviceMetricsOverride", { width:844,height:390,deviceScaleFactor:3,mobile:true,screenOrientation:{type:"landscapePrimary",angle:90} });
    await send("Emulation.setTouchEmulationEnabled", { enabled:true,maxTouchPoints:5 });
    await injectShowcase(true); await delay(350);
    const mobile = await measure();
    const mobileShot = await screenshot("battle-showcase-mobile-844x390.png");

    if (fs.existsSync(referencePath)) {
      const source = fs.readFileSync(referencePath).toString("base64");
      const implementation = fs.readFileSync(desktopShot).toString("base64");
      await send("Emulation.setDeviceMetricsOverride", { width:1600,height:760,deviceScaleFactor:1,mobile:false });
      await evaluate(`(() => { document.documentElement.innerHTML='<head><meta charset="utf-8"><style>body{margin:0;background:#061018;color:#e9f8f4;font-family:Microsoft YaHei,sans-serif}main{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:18px}figure{margin:0;min-width:0}figcaption{margin:0 0 8px}img{display:block;width:100%;height:690px;object-fit:contain;background:#02070b}</style></head><body><main><figure><figcaption>用户截图：卡面被挤在弹窗顶部</figcaption><img src="data:image/png;base64,${source}"></figure><figure><figcaption>修复后：左完整卡面，右结论与效果</figcaption><img src="data:image/png;base64,${implementation}"></figure></main></body>'; return true; })()`);
      await delay(450);
      await screenshot("battle-showcase-reference-comparison.png");
    }

    const rows = { desktop, mobile, files:{desktopShot,mobileShot} };
    console.log(JSON.stringify(rows, null, 2));
    for (const row of [desktop,mobile]) {
      if (row.columns !== 2 || !row.sideBySide || row.clipped || row.horizontal || row.cardObjectFit !== "contain" || row.cardRatio < .72 || row.cardRatio > .78 || row.effectOverflow !== "auto") throw new Error(`battle_showcase_layout_failed:${JSON.stringify(row)}`);
    }
  } finally {
    socket.close(); try { await requestJson(`${debugUrl}/json/close/${target.id}`); } catch {}
    server.closeAllConnections?.(); server.close();
  }
}

main().catch((error) => { console.error(error.stack || error); process.exit(1); });
