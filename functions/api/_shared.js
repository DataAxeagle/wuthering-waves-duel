const MAX_BODY_BYTES = 256 * 1024;
const MODEL = "deepseek-v4-flash";

export function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" } });
}

export async function readJson(request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_BODY_BYTES) throw new Error("request_too_large");
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new Error("request_too_large");
  try { return JSON.parse(text || "{}"); } catch { throw new Error("invalid_json"); }
}

export function cleanApiKey(value) {
  const key = typeof value === "string" ? value.trim() : "";
  if (!key) return "";
  if (key.length < 12 || key.length > 256 || /[\r\n]/.test(key)) throw new Error("invalid_api_key");
  return key;
}

export function modelName() { return MODEL; }

export function systemPrompt(mode, difficulty) {
  const level = { novice: "初级：只做基础合法选择。", standard: "中级：依据公开生命、费用、领队和三色克制做选择。", expert: "高级：综合公开战场、速度、克制和追击机会做选择。" }[difficulty] || "初级：只做基础合法选择。";
  return `你是严格遵守规则的卡牌游戏 AI。只能从用户提供的合法选项中选择，不能虚构卡牌、费用或动作。红克绿、绿克蓝、蓝克红；同色红绿比较速度，完全相同则抵消。盖牌内容是隐藏信息，不能假设知道对手的牌。当前决策模式：${mode}。${level}。必须只输出 JSON，不要 markdown。turn_plan 格式：{"chargeUid":string|null,"upgrade":{"heroIndex":number,"discardUid":string}|null,"switchHeroIndex":number|null,"contestUid":string|null,"endTurn":boolean,"reason":string}。contest_response 格式：{"responseUid":string|null,"reason":string}。pursuit 格式：{"pursuitUid":string|null,"reason":string}。`;
}
