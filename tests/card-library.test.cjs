const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const catalog = require("../mobile/card-library/catalog.js");
const desktopCatalog = require("../demo/card-library/catalog.js");
const { presets } = require("../mobile/card-library/presets.js");
const { presets: desktopPresets } = require("../demo/card-library/presets.js");

test("实体卡组分类库只收录有来源卡面的卡牌", () => {
  assert.equal(catalog.cards.length, 60);
  assert.equal(new Set(catalog.cards.map((card) => card.id)).size, 60);
  assert.equal(catalog.cards.filter((card) => card.type === "character").length, 26);
  assert.equal(catalog.cards.filter((card) => card.type === "action").length, 34);
  for (const card of catalog.cards) {
    if (card.art) assert.ok(fs.existsSync(path.join(__dirname, "..", "mobile", "card-library", card.art)), `${card.id} 的手机版卡面缺失`);
  }
  assert.equal(desktopCatalog.cards.length, 60);
  assert.equal(desktopCatalog.cards.filter((card) => card.type === "character").length, 26);
  assert.equal(desktopCatalog.cards.filter((card) => card.type === "action").length, 34);
  assert.deepEqual(desktopCatalog.cards.map((card) => card.id), catalog.cards.map((card) => card.id));
  for (const id of ["BP01-032", "BP01-029", "BP01-026", "BP01-023", "BP01-005", "BP01-004", "BP01-003", "BP01-002"]) {
    assert.ok(catalog.cards.some((card) => card.id === id && card.type === "character"), `新增角色卡 ${id} 缺失`);
  }
  const chixia = catalog.cards.find((card) => card.id === "BP01-027");
  assert.equal(chixia.text, "【领队】【对抗】己方以红色卡对抗时，造成1点伤害。");
  const red = catalog.cards.find((card) => card.id === "SD02-007");
  assert.deepEqual([red.speed, red.attack], [7, 1]);
  const green = catalog.cards.find((card) => card.id === "SD02-020");
  assert.deepEqual([green.speed, green.attack], [5, 0]);
  assert.equal(green.name, "感知");
  assert.equal(green.art, "art/绿色功能/SD02-021.webp", "感知必须使用正确的 SD02-021 卡面");
  const hook = catalog.cards.find((card) => card.id === "SD02-021");
  assert.equal(hook.name, "钩索");
  assert.equal(hook.art, "art/绿色功能/SD02-020.webp", "钩索必须使用正确的 SD02-020 卡面");
  const blue = catalog.cards.find((card) => card.id === "SD01-008");
  assert.deepEqual([blue.speed, blue.attack], [0, 3]);
  const ling = catalog.cards.find((card) => card.id === "SD02-010");
  assert.match(ling.text, /本回合中己方不能切换领队/);
  assert.match(ling.text, /抽3张卡/);
  assert.match(ling.text, /【追击8】/);
  for (const id of ["BP01-021", "BP01-018"]) {
    const rover = catalog.cards.find((card) => card.id === id);
    assert.match(rover.text, /己方以绿色卡对抗时/);
    assert.doesNotMatch(rover.text, /失败/);
    assert.match(rover.text, /顶2张卡/);
  }
});

test("男女漂泊者预设均为 9 张角色牌和 40 张行动牌", () => {
  assert.deepEqual(desktopPresets, presets);
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
  assert.match(ui, /function cardArtPath\(art\)/);
  assert.match(ui, /encodeURI\(`card-library\/\$\{String\(art\)/);
  assert.doesNotMatch(ui, /assets\/(heroes|actions)/);
});
