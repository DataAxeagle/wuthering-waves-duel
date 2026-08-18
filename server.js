"use strict";

const http = require("node:http");
const https = require("node:https");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const HOST = process.env.GAME_HOST || "127.0.0.1";
const PORT = Number(process.env.GAME_PORT || 4173);
const DEMO_ROOT = path.resolve(__dirname, "demo");
const PACKAGE_ROOT = path.basename(__dirname).toLowerCase() === "app" ? path.dirname(__dirname) : __dirname;
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
const API_URL = new URL("https://api.deepseek.com/chat/completions");
const MAX_BODY = 512 * 1024;
const AI_STATE_DIRECTORY = path.join(process.env.LOCALAPPDATA || process.env.APPDATA || path.join(__dirname, ".local"), "WutheringWavesDuel");
const AI_KEY_FILE = path.join(AI_STATE_DIRECTORY, "deepseek-key.dat");
const PLAYER_PROFILE_FILE = path.join(AI_STATE_DIRECTORY, "player-profile.json");
const DECISION_LOG_DIRECTORY = path.join(PACKAGE_ROOT, "AI决策记录");
const CLIENT_LEASE_MS = 9000;
const CLIENT_EXIT_GRACE_MS = 1200;
const clients = new Map();
let shutdownTimer = null;

function powershell(script, input) {
  const result = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script], {
    input: input || "",
    encoding: "utf8",
    windowsHide: true,
    timeout: 5000,
  });
  if (result.error || result.status !== 0) return { ok: false, output: "" };
  return { ok: true, output: String(result.stdout || "").trim() };
}

function loadSavedApiKey() {
  if (process.platform !== "win32" || !fs.existsSync(AI_KEY_FILE)) return "";
  const script = `Add-Type -AssemblyName System.Security; $path = ${JSON.stringify(AI_KEY_FILE)}; if (-not (Test-Path -LiteralPath $path)) { exit 0 }; try { $encoded = [IO.File]::ReadAllText($path).Trim(); if ([string]::IsNullOrWhiteSpace($encoded)) { exit 0 }; $protected = [Convert]::FromBase64String($encoded); $plain = [Security.Cryptography.ProtectedData]::Unprotect($protected, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser); [Console]::Out.Write([Convert]::ToBase64String($plain)) } catch { exit 1 }`;
  const result = powershell(script, "");
  if (!result.ok || !result.output) return "";
  try { return Buffer.from(result.output, "base64").toString("utf8").trim(); }
  catch { return ""; }
}

function saveApiKey(value) {
  if (process.platform !== "win32") return false;
  const script = `Add-Type -AssemblyName System.Security; $path = ${JSON.stringify(AI_KEY_FILE)}; $value = [Console]::In.ReadToEnd().Trim(); try { if ([string]::IsNullOrWhiteSpace($value)) { if (Test-Path -LiteralPath $path) { Remove-Item -LiteralPath $path -Force }; exit 0 }; New-Item -ItemType Directory -Path (Split-Path -Parent $path) -Force | Out-Null; $plain = [Text.Encoding]::UTF8.GetBytes($value); $protected = [Security.Cryptography.ProtectedData]::Protect($plain, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser); [IO.File]::WriteAllText($path, [Convert]::ToBase64String($protected), [Text.UTF8Encoding]::new($false)) } catch { exit 1 }`;
  return powershell(script, value).ok;
}

let apiKey = process.env.DEEPSEEK_API_KEY || loadSavedApiKey();

function clearShutdownTimer() {
  if (shutdownTimer) clearTimeout(shutdownTimer);
  shutdownTimer = null;
}

function pruneInactiveClients() {
  const now = Date.now();
  for (const [clientId, lastSeen] of clients) if (now - lastSeen > CLIENT_LEASE_MS) clients.delete(clientId);
}

function scheduleShutdownIfIdle() {
  clearShutdownTimer();
  shutdownTimer = setTimeout(() => {
    pruneInactiveClients();
    if (clients.size === 0) process.exit(0);
  }, CLIENT_EXIT_GRACE_MS);
}

function touchClient(clientId) {
  if (!clientId) return false;
  clearShutdownTimer();
  clients.set(clientId, Date.now());
  return true;
}

function removeClient(clientId) {
  if (clientId) clients.delete(clientId);
  pruneInactiveClients();
  if (clients.size === 0) scheduleShutdownIfIdle();
}

function readPlayerProfile() {
  try {
    if (!fs.existsSync(PLAYER_PROFILE_FILE)) return null;
    const profile = JSON.parse(fs.readFileSync(PLAYER_PROFILE_FILE, "utf8"));
    return profile && typeof profile === "object" ? profile : null;
  } catch { return null; }
}

function savePlayerProfile(profile) {
  if (!profile || typeof profile !== "object") return false;
  try {
    fs.mkdirSync(AI_STATE_DIRECTORY, { recursive: true });
    const tempPath = `${PLAYER_PROFILE_FILE}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify({ ...profile, updatedAt: new Date().toISOString() }), "utf8");
    fs.renameSync(tempPath, PLAYER_PROFILE_FILE);
    return true;
  } catch { return false; }
}

function appendDecisionLog(payload) {
  const matchId = String(payload.matchId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  if (!matchId) return false;
  try {
    fs.mkdirSync(DECISION_LOG_DIRECTORY, { recursive: true });
    const filePath = path.join(DECISION_LOG_DIRECTORY, `${matchId}.md`);
    const timestamp = new Date().toLocaleString("zh-CN", { hour12: false });
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, `# AI 决策记录\n\n- 对局：${matchId}\n- 首次记录：${timestamp}\n\n`, "utf8");
    }
    const section = [
      `## ${timestamp} · ${String(payload.mode || "unknown")}`,
      "",
      `- 难度：${String(payload.difficulty || "novice")}`,
      `- 来源：${String(payload.source || "DeepSeek")}`,
      "",
      "### AI 选择",
      "```json",
      JSON.stringify(payload.decision || null, null, 2),
      "```",
      "",
      "### 公开局面与合法选项",
      "```json",
      JSON.stringify({ state: payload.state || null, legal: payload.legal || null }, null, 2),
      "```",
      "",
    ].join("\n");
    fs.appendFileSync(filePath, section, "utf8");
    return true;
  } catch { return false; }
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
};

function sendJson(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  response.end(body);
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error("request_too_large"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        reject(new Error("invalid_json"));
      }
    });
    request.on("error", reject);
  });
}

function difficultyPrompt(difficulty) {
  return {
    novice: "难度：初级。只掌握基础规则；从合法动作中做直接选择，优先使用可用卡牌，不需要研究对方领队或推测其隐藏牌。",
    standard: "难度：中级。观察对方公开领队、生命、费用、手牌数与三色克制，做基础策略判断；不得假设知道隐藏牌。",
    expert: "难度：高级。严格基于全部公开战场、领队被动、费用、伤害斩杀线、速度、克制与追击机会，选择当前最优的合法动作；隐藏牌只能依据公开领队进行概率推断。",
  }[difficulty] || "难度：初级。只做基础合法选择。";
}

function systemPrompt(mode, difficulty) {
  return `你是一个严格遵守规则的卡牌游戏 AI。你只能从用户提供的合法选项中选择，不能虚构卡牌、费用或动作。
规则摘要：主角牌没有攻击力或防御力，只有领队被动；主要阶段中充能、升级、更换领队各最多一次且可跳过；升级可以选择领队或后台角色；充能区每张牌提供 1 点一次性费用，支付后进入弃牌区且下回合不恢复。战斗阶段时双方先盖一张符合当前费用的牌，任何一方都不能根据费用猜测对方的盖牌；只有双方同时翻开时才一起扣费。红色攻击克绿色攻击，绿色攻击克蓝色躲避，蓝色躲避克红色攻击；同色红色或绿色行动卡比较速度；速度相同由回合方获胜；完全相同的卡牌互相抵消。对抗胜利时按胜利行动卡的伤害值造成伤害，蓝色卡战胜红色卡时同样按蓝色卡伤害造成伤害；蓝蓝双方各自触发效果且无伤害，遭克制的蓝色牌不触发效果。只有红色行动卡胜利后可在费用足够时无限连击红色行动卡；绿色行动卡只有在卡牌文本明确授予追击次数时才能进行对应次数的有限连击。对手盖牌内容是隐藏信息，不得假设自己知道。
当前决策模式：${mode}。
${difficultyPrompt(difficulty)}
必须只输出 JSON 对象，不要输出 markdown。turn_plan 格式：{"chargeUid":string|null,"upgrade":{"heroIndex":number,"discardUid":string}|null,"switchHeroIndex":number|null,"contestUid":string|null,"endTurn":boolean,"reason":string}。contest_response 格式：{"responseUid":string|null,"reason":string}。pursuit 格式：{"pursuitUid":string|null,"reason":string}，null 表示停止追击。`;
}

function callDeepSeek(payload) {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt(payload.mode, payload.difficulty) },
        { role: "user", content: `请根据以下公开局面和合法选项做决策，并输出 json：\n${JSON.stringify(payload)}` },
      ],
      response_format: { type: "json_object" },
      thinking: { type: "disabled" },
      temperature: 0.2,
      max_tokens: 500,
      stream: false,
    });
    const request = https.request({
      protocol: API_URL.protocol,
      hostname: API_URL.hostname,
      path: API_URL.pathname,
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(requestBody),
      },
      timeout: 20000,
    }, (apiResponse) => {
      const chunks = [];
      apiResponse.on("data", (chunk) => chunks.push(chunk));
      apiResponse.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf8");
        if (apiResponse.statusCode < 200 || apiResponse.statusCode >= 300) {
          reject(new Error(`deepseek_http_${apiResponse.statusCode}`));
          return;
        }
        try {
          const parsed = JSON.parse(raw);
          const content = parsed.choices?.[0]?.message?.content;
          if (!content) throw new Error("empty_content");
          resolve({ decision: JSON.parse(content), model: parsed.model || MODEL });
        } catch (error) {
          reject(new Error(`deepseek_invalid_response:${error.message}`));
        }
      });
    });
    request.on("timeout", () => request.destroy(new Error("deepseek_timeout")));
    request.on("error", reject);
    request.end(requestBody);
  });
}

function serveStatic(request, response) {
  const requestPath = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  const relative = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
  const filePath = path.resolve(DEMO_ROOT, relative);
  if (filePath !== DEMO_ROOT && !filePath.startsWith(`${DEMO_ROOT}${path.sep}`)) {
    sendJson(response, 403, { error: "forbidden" });
    return;
  }
  fs.stat(filePath, (error, stat) => {
    if (error || !stat.isFile()) {
      sendJson(response, 404, { error: "not_found" });
      return;
    }
    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": MIME[extension] || "application/octet-stream",
      "Cache-Control": [".html", ".js", ".css"].includes(extension) ? "no-store" : "public, max-age=300",
    });
    fs.createReadStream(filePath).pipe(response);
  });
}

function createServer() {
  return http.createServer(async (request, response) => {
    if (request.method === "GET" && request.url === "/api/status") {
      sendJson(response, 200, { app: "wuthering-waves-duel", configured: Boolean(apiKey), model: MODEL, activeClients: clients.size });
      return;
    }
    if (request.method === "POST" && request.url === "/api/session/heartbeat") {
      try {
        const payload = await readJson(request);
        if (!touchClient(String(payload.clientId || "").slice(0, 128))) { sendJson(response, 400, { error: "invalid_client" }); return; }
        sendJson(response, 200, { ok: true, activeClients: clients.size });
      } catch (error) { sendJson(response, 400, { error: error.message || "invalid_request" }); }
      return;
    }
    if (request.method === "POST" && request.url === "/api/session/bye") {
      try {
        const payload = await readJson(request);
        removeClient(String(payload.clientId || "").slice(0, 128));
        sendJson(response, 200, { ok: true, shuttingDownWhenIdle: clients.size === 0 });
      } catch (error) { sendJson(response, 400, { error: error.message || "invalid_request" }); }
      return;
    }
    if (request.method === "GET" && request.url === "/api/player-data") {
      sendJson(response, 200, { profile: readPlayerProfile(), persistence: "windows-user-data" });
      return;
    }
    if (request.method === "POST" && request.url === "/api/player-data") {
      try {
        const payload = await readJson(request);
        if (!savePlayerProfile(payload.profile)) { sendJson(response, 400, { error: "invalid_player_profile" }); return; }
        sendJson(response, 200, { saved: true, persistence: "windows-user-data" });
      } catch (error) { sendJson(response, 400, { error: error.message || "invalid_request" }); }
      return;
    }
    if (request.method === "POST" && request.url === "/api/ai-decision-log") {
      try {
        const payload = await readJson(request);
        if (!appendDecisionLog(payload)) { sendJson(response, 400, { error: "decision_log_failed" }); return; }
        sendJson(response, 200, { saved: true, directory: "AI决策记录" });
      } catch (error) { sendJson(response, 400, { error: error.message || "invalid_request" }); }
      return;
    }
if (request.method === "POST" && request.url === "/api/configure-ai") {
      try {
        const payload = await readJson(request);
        const candidate = typeof payload.apiKey === "string" ? payload.apiKey.trim() : "";
        if (candidate && candidate.length < 12) { sendJson(response, 400, { error: "invalid_api_key" }); return; }
        if (!saveApiKey(candidate)) { sendJson(response, 500, { error: "api_key_save_failed" }); return; }
        apiKey = candidate;
        sendJson(response, 200, { configured: Boolean(apiKey), model: MODEL, persistence: "windows-user-encrypted" });
      } catch (error) { sendJson(response, 400, { error: error.message || "invalid_request" }); }
      return;
    }    if (request.method === "POST" && request.url === "/api/ai-move") {
      if (!apiKey) {
        sendJson(response, 503, { error: "deepseek_not_configured" });
        return;
      }
      try {
        const payload = await readJson(request);
        if (!["turn_plan", "contest_response", "pursuit"].includes(payload.mode)) {
          sendJson(response, 400, { error: "invalid_mode" });
          return;
        }
        const result = await callDeepSeek(payload);
        sendJson(response, 200, result);
      } catch (error) {
        sendJson(response, 502, { error: error.message || "deepseek_failed" });
      }
      return;
    }
    if (request.method === "GET" || request.method === "HEAD") {
      serveStatic(request, response);
      return;
    }
    sendJson(response, 405, { error: "method_not_allowed" });
  });
}

if (require.main === module) {
  createServer().listen(PORT, HOST, () => {
    console.log(`Waves Duel: http://${HOST}:${PORT}`);
    console.log(`DeepSeek: ${apiKey ? `enabled (${MODEL})` : "not configured; local fallback only"}`);
  });
}

module.exports = { createServer, systemPrompt, difficultyPrompt };
