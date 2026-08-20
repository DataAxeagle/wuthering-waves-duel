import { cleanApiKey, json, modelName, readJson, systemPrompt } from "./_shared.js";

const MODES = new Set(["turn_plan", "contest_response", "pursuit"]);

export async function onRequestPost({ request }) {
  try {
    const payload = await readJson(request);
    const apiKey = cleanApiKey(payload.apiKey);
    if (!apiKey) return json({ error: "deepseek_not_configured" }, 503);
    if (!MODES.has(payload.mode)) return json({ error: "invalid_mode" }, 400);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    let upstream;
    try {
      upstream = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST", signal: controller.signal,
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({ model: modelName(), messages: [{ role: "system", content: systemPrompt(payload.mode, payload.difficulty) }, { role: "user", content: `请根据以下公开局面和合法选项做 JSON 决策：${JSON.stringify({ mode: payload.mode, state: payload.state, legal: payload.legal })}` }], response_format: { type: "json_object" }, thinking: { type: "disabled" }, temperature: 0.2, max_tokens: 500, stream: false }),
      });
    } finally { clearTimeout(timeout); }
    const raw = await upstream.text();
    if (!upstream.ok) return json({ error: `deepseek_http_${upstream.status}` }, 502);
    const result = JSON.parse(raw);
    const content = result.choices?.[0]?.message?.content;
    if (!content) return json({ error: "deepseek_empty_response" }, 502);
    return json({ decision: JSON.parse(content), model: result.model || modelName() });
  } catch (error) {
    return json({ error: error.name === "AbortError" ? "deepseek_timeout" : (error.message || "deepseek_failed") }, 502);
  }
}
