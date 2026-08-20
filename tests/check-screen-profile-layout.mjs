import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const debugUrl = process.env.WAVES_DUEL_CDP_URL || "http://127.0.0.1:9222";
const gameUrl = process.env.WAVES_DUEL_GAME_URL || "http://127.0.0.1:4178/";
const outputDir = process.env.WAVES_DUEL_PROFILE_OUTPUT || path.resolve("output", "测试", "2026-08-20", "屏幕适配");
const mobileRoot = path.resolve("mobile");
const profiles = [
  { value: "classic", label: "经典16比9", width: 736, height: 414, actionWidth: "94px", handHeight: 106 },
  { value: "standard", label: "全面屏19点5比9", width: 852, height: 393, actionWidth: "102px", handHeight: 112 },
  { value: "wide", label: "安卓宽屏20比9", width: 915, height: 412, actionWidth: "112px", handHeight: 118 },
];

async function startStaticServer() {
  if (process.env.WAVES_DUEL_GAME_URL) return null;
  const types = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8", ".json":"application/json; charset=utf-8", ".png":"image/png", ".webp":"image/webp" };
  const server = http.createServer((request, response) => {
    const requestPath = decodeURIComponent(new URL(request.url, gameUrl).pathname);
    const relative = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
    const file = path.resolve(mobileRoot, relative);
    if (!file.startsWith(`${mobileRoot}${path.sep}`) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return response.writeHead(404).end("not found");
    response.writeHead(200, { "content-type":types[path.extname(file).toLowerCase()] || "application/octet-stream" });
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
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || "profile_evaluation_failed");
    return result.result?.value;
  };
  const screenshot = async (name) => {
    const shot = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
    const file = path.join(outputDir, name);
    fs.writeFileSync(file, Buffer.from(shot.data, "base64"));
    return file;
  };

  try {
    await send("Page.enable");
    await send("Runtime.enable");
    for (let attempt = 0; attempt < 60; attempt += 1) {
      if (await evaluate("document.readyState !== 'loading' && !!document.querySelector('#menuSettingsPanel')")) break;
      await delay(100);
    }
    const rows = [];
    for (const profile of profiles) {
      await send("Emulation.setDeviceMetricsOverride", {
        width: profile.width,
        height: profile.height,
        deviceScaleFactor: 3,
        mobile: true,
        screenOrientation: { type: "landscapePrimary", angle: 90 },
      });
      await delay(260);
      await evaluate(`(() => {
        document.documentElement.classList.add('compact-landscape');
        document.querySelector('#mainMenuOverlay')?.classList.remove('hidden');
        document.querySelector('[data-menu-page="settings"]')?.click();
        document.querySelector('input[name="screenProfile"][value="auto"]')?.click();
      })()`);
      await delay(260);
      const automatic = JSON.parse(await evaluate(`JSON.stringify({
        preference: document.documentElement.dataset.screenProfilePreference,
        resolved: document.documentElement.dataset.screenProfile
      })`));
      await evaluate(`document.querySelector('input[name="screenProfile"][value="${profile.value}"]')?.click()`);
      await delay(220);
      const row = JSON.parse(await evaluate(`JSON.stringify((() => {
        const rect = (selector) => { const node=document.querySelector(selector); const box=node?.getBoundingClientRect(); return box ? {left:box.left,top:box.top,right:box.right,bottom:box.bottom,width:box.width,height:box.height}:null; };
        const inside = (child, parent) => child && parent && child.left >= parent.left - 1 && child.right <= parent.right + 1 && child.top >= parent.top - 1 && child.bottom <= parent.bottom + 1;
        const panel=rect('.settings-split-layout'), display=rect('.settings-display-panel'), player=rect('.settings-player-panel'), ai=rect('.settings-ai-panel');
        const action=rect('.action-panel'), hand=rect('.hand-dock'), layout=rect('.game-layout');
        const options=[...document.querySelectorAll('.screen-profile-option')].map((node) => { const box=node.getBoundingClientRect(); return {left:box.left,top:box.top,right:box.right,bottom:box.bottom}; });
        const rootStyle=getComputedStyle(document.documentElement);
        return {
          viewport:[innerWidth,innerHeight],
          preference:document.documentElement.dataset.screenProfilePreference,
          resolved:document.documentElement.dataset.screenProfile,
          checked:document.querySelector('input[name="screenProfile"]:checked')?.value || '',
          stored:localStorage.getItem('waves-duel-screen-profile-v1') || '',
          status:document.querySelector('#screenProfileStatus')?.textContent || '',
          actionWidth:rootStyle.getPropertyValue('--mobile-action-width').trim(),
          actualActionWidth:action?.width || 0,
          actualHandHeight:hand?.height || 0,
          panel,
          horizontal:document.documentElement.scrollWidth > innerWidth + 1,
          panelClipped:!panel || panel.left < 0 || panel.top < 0 || panel.right > innerWidth + 1 || panel.bottom > innerHeight + 1,
          childClipped:![display,player,ai].every((item) => inside(item,panel)),
          optionClipped:options.some((item) => !inside(item,display)),
          battleClipped:!layout || !action || !hand || layout.right > innerWidth + 1 || hand.right > innerWidth + 1 || hand.bottom > innerHeight + 1,
        };
      })())`));
      row.autoPreference = automatic.preference;
      row.autoResolved = automatic.resolved;
      row.expected = profile.value;
      row.file = await screenshot(`${profile.label}-${profile.width}x${profile.height}.png`);
      rows.push(row);
    }
    const failures = rows.filter((row) => {
      const profile = profiles.find((item) => item.value === row.expected);
      return row.autoPreference !== "auto" || row.autoResolved !== row.expected || row.preference !== row.expected || row.resolved !== row.expected || row.checked !== row.expected || row.stored !== row.expected || row.actionWidth !== profile?.actionWidth || Math.abs(row.actualActionWidth - Number.parseFloat(profile?.actionWidth || "0")) > 1 || Math.abs(row.actualHandHeight - (profile?.handHeight || 0)) > 1 || row.horizontal || row.panelClipped || row.childClipped || row.optionClipped || row.battleClipped;
    });
    await send("Page.reload");
    for (let attempt = 0; attempt < 60; attempt += 1) {
      if (await evaluate("document.readyState !== 'loading' && document.documentElement.dataset.screenProfile === 'wide'")) break;
      await delay(100);
    }
    const restored = JSON.parse(await evaluate(`JSON.stringify({
      preference:document.documentElement.dataset.screenProfilePreference,
      resolved:document.documentElement.dataset.screenProfile,
      checked:document.querySelector('input[name="screenProfile"]:checked')?.value || '',
      stored:localStorage.getItem('waves-duel-screen-profile-v1') || ''
    })`));
    fs.writeFileSync(path.join(outputDir, "screen-profile-layout-report.json"), JSON.stringify({ profiles: rows, restored }, null, 2));
    console.log(JSON.stringify(rows, null, 2));
    if (failures.length) throw new Error(`screen_profile_layout_failed: ${JSON.stringify(failures)}`);
    if ([restored.preference, restored.resolved, restored.checked, restored.stored].some((value) => value !== "wide")) throw new Error(`screen_profile_restore_failed: ${JSON.stringify(restored)}`);
    console.log(`Screen profile persistence restored: ${JSON.stringify(restored)}`);
    console.log(`Screen profile layout passed at ${rows.length} viewport profiles.`);
  } finally {
    socket.close();
    try { await requestJson(`${debugUrl}/json/close/${target.id}`); } catch { /* QA 标签关闭失败不覆盖测试结果 */ }
    localServer?.closeAllConnections?.();
    localServer?.close();
  }
}

main().catch((error) => { console.error(error.stack || error); process.exit(1); });
