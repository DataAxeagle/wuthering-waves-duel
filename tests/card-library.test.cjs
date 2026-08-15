const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const catalog = require("../demo/card-library/catalog.js");
const { presets } = require("../demo/card-library/presets.js");

test("实体卡组分类库收录来源卡、炽霞 Lv.0 与用户确认的砰砰卡", () => {
  assert.equal(catalog.cards.length, 52);
  assert.equal(new Set(catalog.cards.map((card) => card.id)).size, 52);
  assert.equal(catalog.cards.filter((card) => card.type === "character").length, 18);
  assert.equal(catalog.cards.filter((card) => card.type === "action").length, 34);
  for (const card of catalog.cards) {
    if (card.sourceImage) assert.ok(fs.existsSync(path.join(__dirname, "..", "卡牌素材", card.sourceImage)), `${card.id} 的来源图缺失`);
    if (card.art) assert.ok(fs.existsSync(path.join(__dirname, "..", "demo", "card-library", card.art)), `${card.id} 的裁剪卡面缺失`);
  }
  const chixia = catalog.cards.find((card) => card.id === "BP01-027");
  assert.equal(chixia.text, "【领队】【对抗】己方以红色卡对抗时，造成1点伤害。");
  const red = catalog.cards.find((card) => card.id === "SD02-007");
  assert.deepEqual([red.speed, red.attack], [7, 1]);
  const green = catalog.cards.find((card) => card.id === "SD02-020");
  assert.deepEqual([green.speed, green.attack], [5, 0]);
  const blue = catalog.cards.find((card) => card.id === "LOCAL-CHIXIA-002");
  assert.deepEqual([blue.speed, blue.attack], [0, 3]);
  const ling = catalog.cards.find((card) => card.id === "SD02-010");
  assert.match(ling.text, /本回合中己方不能切换领队/);
  assert.match(ling.text, /抽3张卡/);
  assert.match(ling.text, /【追击8】/);
});

test("男女漂泊者预设均为 9 张角色牌和 40 张行动牌", () => {
  assert.deepEqual(Object.keys(presets).sort(), ["rover-female-yangyang-chixia", "rover-male-jinhsi-sanhua"]);
  for (const preset of Object.values(presets)) {
    assert.equal(preset.roleCards.length, 9, `${preset.name} 的角色牌数量`);
    assert.equal(preset.actions.reduce((total, [, copies]) => total + copies, 0), 40, `${preset.name} 的行动牌数量`);
    for (const roleCard of preset.roleCards) assert.ok(catalog.cards.some((card) => card.id === roleCard && card.type === "character"), `${preset.name} 缺少角色牌 ${roleCard}`);
    for (const [actionId] of preset.actions) assert.ok(catalog.cards.some((card) => card.id === actionId && card.type === "action"), `${preset.name} 缺少行动牌 ${actionId}`);
  }
});

test("实体卡库覆盖运行时行动卡，且不引用旧 AI 卡面路径", () => {
  const core = fs.readFileSync(path.join(__dirname, "..", "demo", "core.js"), "utf8");
  const ui = fs.readFileSync(path.join(__dirname, "..", "demo", "game.js"), "utf8");
  assert.match(core, /card-library\/catalog\.js/);
  assert.match(core, /card-library\/presets\.js/);
  assert.match(ui, /card-library\/\$\{art\}/);
  assert.doesNotMatch(ui, /assets\/(heroes|actions)/);
});
