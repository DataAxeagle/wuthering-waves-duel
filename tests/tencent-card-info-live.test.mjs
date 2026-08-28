import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";

const baseUrl = new URL(process.env.TENCENT_PVP_BASE_URL || "https://ai-axeagle.com/");
const version = process.env.WAVES_DUEL_ASSET_VERSION || "20260823-1910";

async function fetchText(relative) {
  const response = await fetch(new URL(relative, baseUrl), { cache:"no-store" });
  assert.equal(response.status, 200, `${relative} 应返回 200`);
  return { response, text:await response.text() };
}

test("正式首页引用带版本参数的卡库、游戏脚本和样式", async () => {
  const { text } = await fetchText(`?verify=${version}`);
  for (const asset of ["styles.css", "card-library/catalog.js", "card-library/presets.js", "core.js", "pvp-game.js", "game.js"]) {
    assert.match(text, new RegExp(`${asset.replaceAll(".", "\\.")}\\?v=${version}`), `${asset} 应强制刷新到 ${version}`);
  }
});

test("正式卡库与卡牌详情渲染代码完整可读", async () => {
  const catalog = await fetchText(`card-library/catalog.js?v=${version}`);
  assert.match(catalog.response.headers.get("content-type") || "", /javascript/);
  const context = { globalThis:{} };
  vm.runInNewContext(catalog.text, context);
  const cards = context.globalThis.WavesDuelCardLibrary?.cards || [];
  assert.equal(cards.length, 60);
  assert.equal(cards.every((card) => card.id && card.name && card.art && typeof card.text === "string"), true);

  const game = await fetchText(`game.js?v=${version}`);
  assert.match(game.text, /function renderCodexCardFor/);
  assert.match(game.text, /function cardSupplementalAttributeText/);
  assert.match(game.text, /function renderDeckBuilderPreview/);
});
