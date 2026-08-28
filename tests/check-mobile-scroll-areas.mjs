import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const mobileRoot = path.resolve("mobile");
const debugUrl = process.env.WAVES_DUEL_CDP_URL || "http://127.0.0.1:9222";
const baseUrl = "http://127.0.0.1:4179/";
const remoteUrl = process.env.WAVES_DUEL_SCROLL_URL || "";
const pageUrl = remoteUrl || baseUrl;
const outputDir = path.resolve(process.env.WAVES_DUEL_SCROLL_SCREENSHOTS || "output/测试/2026-08-22/mobile-scroll-areas");
const viewportHeight = Math.max(300, Number(process.env.WAVES_DUEL_SCROLL_HEIGHT) || 390);

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
  const types = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8", ".json":"application/json; charset=utf-8", ".png":"image/png", ".webp":"image/webp", ".mp4":"video/mp4" };
  const server = remoteUrl ? null : http.createServer((request, response) => {
    const relative = decodeURIComponent(new URL(request.url, baseUrl).pathname).replace(/^\/+/, "") || "index.html";
    const file = path.resolve(mobileRoot, relative);
    if (!file.startsWith(`${mobileRoot}${path.sep}`) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return response.writeHead(404).end("not found");
    response.writeHead(200, { "content-type":types[path.extname(file).toLowerCase()] || "application/octet-stream" });
    fs.createReadStream(file).pipe(response);
  });
  if (server) await new Promise((resolve, reject) => server.listen(4179, "127.0.0.1", resolve).once("error", reject));
  const separator = pageUrl.includes("?") ? "&" : "?";
  const target = await requestJson(`${debugUrl}/json/new?${encodeURIComponent(`${pageUrl}${separator}ui=mobile&scroll_check=${Date.now()}`)}`, "PUT");
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once:true }); socket.addEventListener("error", reject, { once:true }); });
  let sequence = 0;
  const pending = new Map();
  const consoleErrors = [];
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown") consoleErrors.push(message.params.exceptionDetails?.text || "runtime_exception");
    if (!message.id || !pending.has(message.id)) return;
    const callback = pending.get(message.id); pending.delete(message.id);
    if (message.error) callback.reject(new Error(message.error.message)); else callback.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, {resolve,reject}); socket.send(JSON.stringify({id,method,params})); });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, returnByValue:true, awaitPromise:true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "browser_evaluation_failed");
    return result.result.value;
  };
  const screenshot = async (name) => {
    const shot = await send("Page.captureScreenshot", { format:"png", fromSurface:true });
    fs.mkdirSync(outputDir, { recursive:true });
    fs.writeFileSync(path.join(outputDir, name), Buffer.from(shot.data, "base64"));
  };
  try {
    await send("Page.enable"); await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", { width:844, height:viewportHeight, deviceScaleFactor:3, mobile:true, screenOrientation:{type:"landscapePrimary",angle:90} });
    await send("Emulation.setTouchEmulationEnabled", { enabled:true, maxTouchPoints:5 });
    for (let index=0; index<80; index+=1) { if (await evaluate("document.readyState !== 'loading' && !!document.querySelector('#mainMenuOverlay')")) break; await delay(100); }
    await evaluate("document.documentElement.classList.add('compact-landscape');document.querySelector('[data-menu-page=\"codex\"]')?.click();true");
    await delay(250);
    const codex = JSON.parse(await evaluate(`JSON.stringify((() => {
      const detail=document.querySelector('#menuCodexPanel .codex-detail');
      const visual=document.querySelector('#menuCodexPanel .codex-card-visual');
      const image=visual?.querySelector('img');
      const info=document.querySelector('#menuCodexPanel .codex-card-info');
      const box=(node)=>{const r=node.getBoundingClientRect();return{top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height}};
      const probe=document.createElement('p'); probe.textContent='超长卡牌效果滚动验证。'.repeat(80); info.appendChild(probe);
      const before=info.scrollTop; info.scrollTop=info.scrollHeight; const after=info.scrollTop;
      const metrics={detail:box(detail),visual:box(visual),image:box(image),info:box(info),infoOverflow:getComputedStyle(info).overflowY,infoClientHeight:info.clientHeight,infoScrollHeight:info.scrollHeight,infoScrollMoved:after>before};
      probe.remove(); info.scrollTop=0; return metrics;
    })())`));
    await evaluate("document.querySelector('#menuCodexPanel .codex-card-info').scrollTop=0;true");
    await screenshot(`codex-844x${viewportHeight}.png`);

    const battle = JSON.parse(await evaluate(`JSON.stringify((() => {
      document.querySelector('#mainMenuOverlay').style.display='none';
      const preview=document.querySelector('#selectionPreview');
      preview.classList.remove('empty');
      preview.innerHTML='<article class="preview-card"><span class="tone-tag">蓝色防御 / 已方角色技能</span><h3>漂泊者（女）· Lv.1</h3><p class="cost-line">已方已叠放 2 张角色卡 // 后台角色</p><p class="description">'+('这是用于验证超长卡牌效果说明能够完整上下滑动的测试文字。'.repeat(18))+'</p></article>';
      const panel=document.querySelector('.hand-selection-panel');
      const card=preview.querySelector('.preview-card');
      const box=(node)=>{const r=node.getBoundingClientRect();return{top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height}};
      const topGap=box(preview).top-box(panel).top;
      const before=preview.scrollTop; preview.scrollTop=preview.scrollHeight; const after=preview.scrollTop;
      return {panel:box(panel),preview:box(preview),card:box(card),overflow:getComputedStyle(preview).overflowY,clientHeight:preview.clientHeight,scrollHeight:preview.scrollHeight,scrollMoved:after>before,topGap};
    })())`));
    await evaluate("document.querySelector('#selectionPreview').scrollTop=0;true");
    await screenshot(`battle-detail-844x${viewportHeight}.png`);

    const codexFits = codex.visual.bottom <= codex.detail.bottom + 1 && codex.image.bottom <= codex.visual.bottom + 1 && codex.image.top >= codex.visual.top - 1;
    const codexScrolls = codex.infoOverflow === "auto" && codex.infoScrollHeight > codex.infoClientHeight && codex.infoScrollMoved;
    const battleScrolls = battle.overflow === "auto" && battle.scrollHeight > battle.clientHeight && battle.scrollMoved && battle.topGap <= 2;
    const report = { pageUrl, viewport:{width:844,height:viewportHeight,deviceScaleFactor:3}, codex:{...codex,fits:codexFits,scrolls:codexScrolls}, battle:{...battle,scrolls:battleScrolls}, consoleErrors, passed:codexFits&&codexScrolls&&battleScrolls&&consoleErrors.length===0 };
    console.log(JSON.stringify(report, null, 2));
    if (!report.passed) process.exitCode = 1;
  } finally {
    socket.close(); try { await requestJson(`${debugUrl}/json/close/${target.id}`); } catch {}
    server?.closeAllConnections?.(); server?.close();
  }
}

main().catch((error)=>{console.error(error.stack||error);process.exit(1);});
