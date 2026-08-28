import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const debugUrl = process.env.WAVES_DUEL_CDP_URL || "http://127.0.0.1:9222";
const targetUrl = process.env.WAVES_DUEL_PVP_URL || "https://wuthering-waves-duel-mobile.pages.dev/pvp.html";
const outputDir = path.resolve(process.env.WAVES_DUEL_TURNSTILE_OUTPUT || "output/测试/2026-08-22/turnstile-live-diagnosis");
const preserveStorage = process.env.WAVES_DUEL_PRESERVE_STORAGE === "1";
const createTestRoom = process.env.WAVES_DUEL_CREATE_TEST_ROOM === "1";
const clickRetry = process.env.WAVES_DUEL_CLICK_RETRY === "1";
const crossPageReturn = process.env.WAVES_DUEL_CROSS_PAGE_RETURN === "1";
const diagnosticWaitMs = Math.max(1000, Number(process.env.WAVES_DUEL_DIAG_WAIT_MS) || 12000);

function requestJson(url, method = "GET") {
  return new Promise((resolve, reject) => {
    const request = http.request(url, { method }, (response) => {
      let body = "";
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => {
        try { resolve(JSON.parse(body)); }
        catch (error) { reject(new Error(`invalid_json:${response.statusCode}:${body.slice(0, 200)}`, { cause:error })); }
      });
    });
    request.on("error", reject);
    request.end();
  });
}

function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function main() {
  fs.mkdirSync(outputDir, { recursive:true });
  const url = new URL(targetUrl);
  url.searchParams.set("turnstile_diagnosis", Date.now().toString());
  const target = await requestJson(`${debugUrl}/json/new?${encodeURIComponent(url.href)}`, "PUT");
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once:true });
    socket.addEventListener("error", reject, { once:true });
  });
  let sequence = 0;
  const pending = new Map();
  const consoleMessages = [];
  const exceptions = [];
  const relevantResponses = [];
  const failedRequests = [];
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const callback = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) callback.reject(new Error(message.error.message));
      else callback.resolve(message.result);
      return;
    }
    if (message.method === "Runtime.consoleAPICalled") {
      consoleMessages.push({ type:message.params.type, args:message.params.args.map((arg) => arg.value ?? arg.description ?? "") });
    } else if (message.method === "Runtime.exceptionThrown") {
      exceptions.push(message.params.exceptionDetails?.exception?.description || message.params.exceptionDetails?.text || "unknown_exception");
    } else if (message.method === "Network.responseReceived") {
      const response = message.params.response;
      if (/turnstile|challenges\.cloudflare|supabase|jsdelivr|pvp\.(?:js|html)|pvp-config/.test(response.url)) {
        relevantResponses.push({ url:response.url, status:response.status, mimeType:response.mimeType, fromDiskCache:response.fromDiskCache });
      }
    } else if (message.method === "Network.loadingFailed") {
      failedRequests.push({ requestId:message.params.requestId, errorText:message.params.errorText, blockedReason:message.params.blockedReason || "" });
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, awaitPromise:true, returnByValue:true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  try {
    await Promise.all([send("Page.enable"), send("Runtime.enable"), send("Network.enable")]);
    const expectedOrigin = new URL(targetUrl).origin;
    let targetReady = false;
    for (let attempt = 0; attempt < 80; attempt += 1) {
      await delay(250);
      try {
        targetReady = await evaluate(`location.origin === ${JSON.stringify(expectedOrigin)} && document.readyState !== 'loading'`);
        if (targetReady) break;
      } catch { /* 初始不可读文档会在导航完成后消失 */ }
    }
    if (!targetReady) throw new Error("target_origin_ready_timeout");
    if (!preserveStorage) {
      await evaluate("localStorage.clear(); sessionStorage.clear(); true");
      await send("Page.reload", { ignoreCache:true });
    }
    await delay(diagnosticWaitMs);
    const state = await evaluate(`(() => {
      const status = document.querySelector('#turnstileStatus');
      const slot = document.querySelector('#turnstileSlot');
      const retry = document.querySelector('#turnstileRetryButton');
      const create = document.querySelector('#createRoomButton');
      const join = document.querySelector('#joinRoomButton');
      return {
        href:location.href,
        title:document.title,
        readyState:document.readyState,
        statusText:status?.textContent?.trim() || '',
        statusState:status?.dataset?.state || '',
        retryVisible:Boolean(retry && !retry.classList.contains('hidden')),
        createDisabled:Boolean(create?.disabled),
        joinDisabled:Boolean(join?.disabled),
        slotChildren:slot?.children?.length || 0,
        slotText:slot?.textContent?.trim() || '',
        iframeCount:slot?.querySelectorAll('iframe').length || 0,
        iframeSources:[...document.querySelectorAll('iframe')].map((node) => node.src).filter(Boolean),
        turnstileLoaded:Boolean(window.turnstile),
        scriptSource:document.querySelector('#wavesDuelTurnstileScript')?.src || '',
        siteKey:window.WavesDuelPvpConfig?.turnstileSiteKey || '',
        supabaseLoaded:Boolean(window.supabase),
      };
    })()`);
    let retryTest = null;
    if (clickRetry && state.retryVisible) {
      await evaluate("document.querySelector('#turnstileRetryButton')?.click(); true");
      await delay(1800);
      retryTest = await evaluate(`(() => {
        const status = document.querySelector('#turnstileStatus');
        const retry = document.querySelector('#turnstileRetryButton');
        return {
          statusText:status?.textContent?.trim() || '',
          statusState:status?.dataset?.state || '',
          retryVisible:Boolean(retry && !retry.classList.contains('hidden')),
          slotChildren:document.querySelector('#turnstileSlot')?.children?.length || 0,
        };
      })()`);
    }
    let roomTest = null;
    if (createTestRoom && state.statusState === "success" && !state.createDisabled) {
      await evaluate(`(() => {
        const name = document.querySelector('#displayNameInput');
        if (name) { name.value = 'Codex联调'; name.dispatchEvent(new Event('input', { bubbles:true })); }
        document.querySelector('#createRoomButton')?.click();
        return true;
      })()`);
      await delay(8000);
      roomTest = await evaluate(`(() => {
        const lobby = document.querySelector('#lobbyPanel');
        const setup = document.querySelector('#setupPanel');
        const code = document.querySelector('#roomCodeLabel')?.textContent?.trim() || '';
        const toast = document.querySelector('#toast');
        return {
          lobbyVisible:Boolean(lobby && !lobby.classList.contains('hidden')),
          setupVisible:Boolean(setup && !setup.classList.contains('hidden')),
          roomCodeLength:code.length,
          connectionText:document.querySelector('#connectionBadge')?.textContent?.trim() || '',
          toastText:toast && !toast.classList.contains('hidden') ? toast.textContent.trim() : '',
        };
      })()`);
      if (roomTest.lobbyVisible) {
        await evaluate("document.querySelector('#leaveButton')?.click(); true");
        await delay(3000);
        roomTest.leftRoom = await evaluate("Boolean(document.querySelector('#setupPanel') && !document.querySelector('#setupPanel').classList.contains('hidden'))");
      }
    }
    const authState = await evaluate(`(async () => {
      if (!window.supabase || !window.WavesDuelPvpConfig) return { hasSession:false };
      const authClient = window.supabase.createClient(window.WavesDuelPvpConfig.supabaseUrl, window.WavesDuelPvpConfig.supabasePublishableKey, { auth:{ persistSession:true, autoRefreshToken:false } });
      const { data } = await authClient.auth.getSession();
      return { hasSession:Boolean(data?.session) };
    })()`);
    let crossPageTest = null;
    if (crossPageReturn && state.statusState === "success" && authState.hasSession) {
      await send("Page.navigate", { url:new URL("index.html", targetUrl).href });
      await delay(2200);
      await send("Page.navigate", { url:new URL("pvp.html", targetUrl).href });
      await delay(5000);
      crossPageTest = await evaluate(`(async () => {
        const authClient = window.supabase.createClient(window.WavesDuelPvpConfig.supabaseUrl, window.WavesDuelPvpConfig.supabasePublishableKey, { auth:{ persistSession:true, autoRefreshToken:false } });
        const { data } = await authClient.auth.getSession();
        const status = document.querySelector('#turnstileStatus');
        return {
          hasSession:Boolean(data?.session),
          statusText:status?.textContent?.trim() || '',
          statusState:status?.dataset?.state || '',
          createDisabled:Boolean(document.querySelector('#createRoomButton')?.disabled),
          scriptLoaded:Boolean(document.querySelector('#wavesDuelTurnstileScript')),
        };
      })()`);
    }
    const screenshot = await send("Page.captureScreenshot", { format:"png", fromSurface:true });
    fs.writeFileSync(path.join(outputDir, "live-pvp-turnstile.png"), Buffer.from(screenshot.data, "base64"));
    const report = { capturedAt:new Date().toISOString(), targetUrl, state, authState, retryTest, roomTest, crossPageTest, consoleMessages, exceptions, relevantResponses, failedRequests };
    fs.writeFileSync(path.join(outputDir, "diagnosis.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(JSON.stringify(report, null, 2));
  } finally {
    socket.close();
  }
}

main().catch((error) => { console.error(error.stack || error); process.exit(1); });
