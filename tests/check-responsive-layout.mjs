import http from "node:http";

const gameUrl = process.env.WAVES_DUEL_LAYOUT_URL || "http://127.0.0.1:4177/";
const debugUrl = process.env.WAVES_DUEL_CDP_URL || "http://127.0.0.1:9222";
const viewports = [[1440, 900], [1280, 720], [1050, 720], [1024, 768], [900, 700], [720, 900], [600, 900]];

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
  } finally {
    socket.close();
    try { await requestJson(`${debugUrl}/json/close/${target.id}`); } catch { /* 测试标签关闭失败不掩盖布局检查结果 */ }
  }
}

main().catch((error) => { console.error(error.stack || error); process.exit(1); });
