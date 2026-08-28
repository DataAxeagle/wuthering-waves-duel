import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const mobileRoot = path.resolve("mobile");
const debugUrl = process.env.WAVES_DUEL_CDP_URL || "http://127.0.0.1:9222";
const baseUrl = "http://127.0.0.1:4182/";
const outputPath = path.resolve("output/测试/2026-08-23/pvp-auth-persistence.json");

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
  let sessionRequests = 0;
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, baseUrl).pathname);
    if (pathname === "/api/pvp/session" && request.method === "POST") {
      sessionRequests += 1;
      return response.writeHead(200, { "content-type":"application/json; charset=utf-8", "cache-control":"no-store" }).end(JSON.stringify({
        ok:true,
        access_token:"test-tencent-access-token",
        expires_at:Math.floor(Date.now() / 1000) + 3600,
        user:{ id:"test-tencent-user" },
      }));
    }
    const relative = pathname.replace(/^\/+/, "") || "index.html";
    const file = path.resolve(mobileRoot, relative);
    if (!file.startsWith(`${mobileRoot}${path.sep}`) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return response.writeHead(404).end("not found");
    response.writeHead(200, { "content-type":types[path.extname(file).toLowerCase()] || "application/octet-stream" });
    fs.createReadStream(file).pipe(response);
  });
  await new Promise((resolve, reject) => server.listen(4182, "127.0.0.1", resolve).once("error", reject));
  const target = await requestJson(`${debugUrl}/json/new?${encodeURIComponent(`${baseUrl}pvp.html`)}`, "PUT");
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
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  const waitFor = async (expression, label) => {
    for (let attempt=0; attempt<100; attempt+=1) { try { if (await evaluate(expression)) return; } catch {} await delay(80); }
    throw new Error(`${label}_timeout`);
  };
  try {
    await Promise.all([send("Page.enable"),send("Runtime.enable")]);
    await waitFor("location.pathname.endsWith('/pvp.html') && document.readyState !== 'loading'", "initial_page");
    await evaluate("localStorage.clear(); location.reload(); true");
    await waitFor("document.querySelector('#turnstileStatus')?.dataset.state === 'success' && window.supabase", "tencent_auth_ready");
    await evaluate("window.supabase.createClient(location.origin).auth.signInAnonymously().then(({ error }) => { if (error) throw error; return true; })");
    await waitFor("Boolean(localStorage.getItem('waves-duel-tencent-auth-v1'))", "tencent_session_persist");
    const initial = await evaluate(`(() => ({
      status:document.querySelector('#turnstileStatus')?.textContent?.trim(),
      createDisabled:document.querySelector('#createRoomButton')?.disabled,
      sessionStored:Boolean(localStorage.getItem('waves-duel-tencent-auth-v1')),
      userId:JSON.parse(localStorage.getItem('waves-duel-tencent-auth-v1') || 'null')?.user?.id || null,
    }))()`);
    await send("Page.navigate", { url:`${baseUrl}index.html` });
    await waitFor("location.pathname.endsWith('/index.html') && document.readyState !== 'loading'", "main_game");
    await send("Page.navigate", { url:`${baseUrl}pvp.html` });
    await waitFor("document.querySelector('#turnstileStatus')?.dataset.state === 'success' && window.supabase", "return_pvp");
    const returned = await evaluate(`(() => ({
      status:document.querySelector('#turnstileStatus')?.textContent?.trim(),
      createDisabled:document.querySelector('#createRoomButton')?.disabled,
      sessionStored:Boolean(localStorage.getItem('waves-duel-tencent-auth-v1')),
      userId:JSON.parse(localStorage.getItem('waves-duel-tencent-auth-v1') || 'null')?.user?.id || null,
    }))()`);
    const validStatus = (value) => ["无需人机验证", "身份已验证，可以创建或加入房间"].includes(value);
    const report = { initial, returned, sessionRequests, passed:initial.sessionStored && !initial.createDisabled && validStatus(initial.status) && returned.sessionStored && !returned.createDisabled && validStatus(returned.status) && initial.userId === returned.userId && sessionRequests === 1 };
    fs.mkdirSync(path.dirname(outputPath), { recursive:true });
    fs.writeFileSync(outputPath, `${JSON.stringify(report,null,2)}\n`, "utf8");
    console.log(JSON.stringify(report,null,2));
    if (!report.passed) throw new Error("pvp_auth_persistence_failed");
  } finally {
    socket.close();
    server.closeAllConnections?.(); server.close();
  }
}

main().catch((error) => { console.error(error.stack || error); process.exit(1); });
