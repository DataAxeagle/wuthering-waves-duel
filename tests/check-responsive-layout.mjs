import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const gameUrl = process.env.WAVES_DUEL_LAYOUT_URL || "http://127.0.0.1:4177/";
const debugUrl = process.env.WAVES_DUEL_CDP_URL || "http://127.0.0.1:9222";
const viewports = [[1440, 900], [1280, 720], [1050, 720], [1024, 768], [900, 700], [720, 900], [600, 900]];
const pvpLandscapeViewports = [[844, 390], [667, 375]];
const pvpScreenshotPath = process.env.WAVES_DUEL_PVP_SCREENSHOT || "";
const setupScreenshotPath = process.env.WAVES_DUEL_SETUP_SCREENSHOT || "";
const mobileRoot = path.resolve("mobile");

async function startStaticServer() {
  if (process.env.WAVES_DUEL_LAYOUT_URL) return null;
  const types = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8", ".json":"application/json; charset=utf-8", ".png":"image/png", ".webp":"image/webp" };
  const server = http.createServer((request, response) => {
    const requestPath = decodeURIComponent(new URL(request.url, gameUrl).pathname);
    const relative = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
    const file = path.resolve(mobileRoot, relative);
    if (!file.startsWith(`${mobileRoot}${path.sep}`) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return response.writeHead(404).end("not found");
    response.writeHead(200, { "content-type":types[path.extname(file).toLowerCase()] || "application/octet-stream" });
    fs.createReadStream(file).pipe(response);
  });
  await new Promise((resolve, reject) => server.listen(4177, "127.0.0.1", resolve).once("error", reject));
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

async function waitForExpression(send, expression, timeoutMs = 15000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const result = await send("Runtime.evaluate", { expression, returnByValue:true });
    if (result.result?.value) return;
    await delay(200);
  }
  throw new Error(`layout_page_ready_timeout: ${expression}`);
}

async function main() {
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

  try {
    await send("Page.enable");
    await send("Runtime.enable");
    await waitForExpression(send, "document.readyState !== 'loading' && !!document.querySelector('.game-layout')");
    const rows = [];
    for (const [width, height] of viewports) {
      await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
      await delay(160);
      const expression = `JSON.stringify((() => {
        const rect = (selector) => { const node = document.querySelector(selector); const box = node?.getBoundingClientRect(); return box ? { left: box.left, top: box.top, right: box.right, bottom: box.bottom } : null; };
        const overlap = (a, b) => a && b && a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
        const header = rect('.topbar'), layout = rect('.game-layout'), battle = rect('.battlefield'), action = rect('.action-panel'), hand = rect('.hand-dock');
        return { width: innerWidth, height: innerHeight, horizontal: document.documentElement.scrollWidth > innerWidth + 1, stackOverlap: innerWidth <= 1050 && overlap(battle, action), handOverlap: innerWidth <= 1050 && overlap(action, hand), headerOverlap: overlap(header, layout) };
      })())`;
      const result = await send("Runtime.evaluate", { expression, returnByValue: true });
      rows.push(JSON.parse(result.result.value));
    }
    const failures = rows.filter((row) => row.horizontal || row.stackOverlap || row.handOverlap || row.headerOverlap);
    console.table(rows);
    if (failures.length) throw new Error(`responsive_layout_failed: ${JSON.stringify(failures)}`);
    console.log(`Responsive layout passed at ${rows.length} viewport sizes.`);

    await send("Page.navigate", { url: new URL("pvp.html", gameUrl).href });
    await waitForExpression(send, "document.readyState !== 'loading' && !!document.querySelector('#setupPanel')");
    await delay(400);
    const pvpRows = [];
    for (const [width, height] of pvpLandscapeViewports) {
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 3,
        mobile: true,
        screenOrientation: { type: "landscapePrimary", angle: 90 }
      });
      await delay(240);
      const expression = `JSON.stringify((() => {
        const rect = (selector) => { const node = document.querySelector(selector); const box = node?.getBoundingClientRect(); return box ? { left: box.left, top: box.top, right: box.right, bottom: box.bottom } : null; };
        const header = rect('.pvp-header'), panel = rect('#setupPanel'), main = rect('.setup-main'), actions = rect('.join-grid');
        const panelNode = document.querySelector('#setupPanel');
        const columns = getComputedStyle(panelNode).gridTemplateColumns.split(' ').filter(Boolean).length;
        return {
          width: innerWidth,
          height: innerHeight,
          horizontal: document.documentElement.scrollWidth > innerWidth + 1,
          headerOverlap: header && panel && header.bottom > panel.top + 1,
          panelClipped: panel && panel.bottom > innerHeight + 1,
          contentClipped: panelNode && panelNode.scrollHeight > panelNode.clientHeight + 1,
          mainClipped: main && panel && (main.left < panel.left || main.right > panel.right || main.bottom > panel.bottom),
          actionsClipped: actions && panel && (actions.left < panel.left || actions.right > panel.right || actions.bottom > panel.bottom),
          columns
        };
      })())`;
      const result = await send("Runtime.evaluate", { expression, returnByValue: true });
      pvpRows.push(JSON.parse(result.result.value));
      if (pvpScreenshotPath && width === pvpLandscapeViewports[0][0] && height === pvpLandscapeViewports[0][1]) {
        const screenshot = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
        fs.writeFileSync(pvpScreenshotPath, Buffer.from(screenshot.data, "base64"));
      }
    }
    const pvpFailures = pvpRows.filter((row) => row.horizontal || row.headerOverlap || row.panelClipped || row.contentClipped || row.mainClipped || row.actionsClipped || row.columns < 2);
    console.table(pvpRows);
    if (pvpFailures.length) throw new Error(`pvp_landscape_layout_failed: ${JSON.stringify(pvpFailures)}`);
    console.log(`PVP lobby landscape layout passed at ${pvpRows.length} phone viewport sizes.`);

    await send("Page.navigate", { url: gameUrl });
    await waitForExpression(send, "document.readyState !== 'loading' && !!document.querySelector('#setupOverlay')");
    await delay(300);
    await send("Emulation.setDeviceMetricsOverride", {
      width:844,
      height:390,
      deviceScaleFactor:3,
      mobile:true,
      screenOrientation:{ type:"landscapePrimary", angle:90 }
    });
    await delay(240);
    const setupExpression = `JSON.stringify((() => {
      document.querySelectorAll('.overlay').forEach((node) => node.classList.add('hidden'));
      document.querySelector('#mainMenuOverlay')?.classList.add('hidden');
      const overlay = document.querySelector('#setupOverlay');
      overlay?.classList.remove('hidden');
      const hint = document.querySelector('#initiativeDecisionHint');
      if (hint) hint.hidden = false;
      const choices = document.querySelector('#initiativeChoices');
      if (choices) choices.hidden = false;
      const coin = document.querySelector('#coinResult');
      if (coin) coin.textContent = '你获得决定权；可在确认前修改先手或后手';
      const rect = (selector) => { const node=document.querySelector(selector); const box=node?.getBoundingClientRect(); return box ? {left:box.left,top:box.top,right:box.right,bottom:box.bottom,width:box.width,height:box.height}:null; };
      const modal=rect('#setupOverlay .setup-modal'), hintRect=rect('#initiativeDecisionHint'), mulligan=rect('#setupMulliganCards');
      return { width:innerWidth, height:innerHeight, horizontal:document.documentElement.scrollWidth>innerWidth+1, modalClipped:modal&&(modal.left<0||modal.top<0||modal.right>innerWidth+1||modal.bottom>innerHeight+1), hintVisible:!!hintRect&&hintRect.width>0&&hintRect.height>0, hintOverlap:hintRect&&mulligan&&hintRect.bottom>mulligan.top+1 };
    })())`;
    const setupResult = await send("Runtime.evaluate", { expression:setupExpression, returnByValue:true });
    const setupRow = JSON.parse(setupResult.result.value);
    console.table([setupRow]);
    if (setupRow.horizontal || setupRow.modalClipped || !setupRow.hintVisible || setupRow.hintOverlap) throw new Error(`pvp_setup_hint_layout_failed: ${JSON.stringify(setupRow)}`);
    if (setupScreenshotPath) {
      const screenshot = await send("Page.captureScreenshot", { format:"png", fromSurface:true });
      fs.writeFileSync(setupScreenshotPath, Buffer.from(screenshot.data, "base64"));
    }
    console.log("PVP initiative decision hint layout passed at 844x390.");
  } finally {
    socket.close();
    try { await requestJson(`${debugUrl}/json/close/${target.id}`); } catch { /* 测试标签关闭失败不掩盖布局检查结果 */ }
    localServer?.closeAllConnections?.();
    localServer?.close();
  }
}

main().catch((error) => { console.error(error.stack || error); process.exit(1); });
