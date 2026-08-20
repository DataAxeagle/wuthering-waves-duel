import { cleanApiKey, json, readJson, modelName } from "./_shared.js";

export async function onRequestPost({ request }) {
  try {
    const { apiKey } = await readJson(request);
    const key = cleanApiKey(apiKey);
    return json({ configured: Boolean(key), model: modelName(), persistence: "browser-session" });
  } catch (error) { return json({ error: error.message || "invalid_request" }, 400); }
}
