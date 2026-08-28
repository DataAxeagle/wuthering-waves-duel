const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const game = fs.readFileSync(path.join(projectRoot, "mobile", "game.js"), "utf8");
const css = fs.readFileSync(path.join(projectRoot, "mobile", "styles.css"), "utf8");

test("对抗胜利效果弹窗固定为左完整卡面、右结论与效果", () => {
  assert.match(game, /battle-showcase-layout/);
  assert.match(game, /battle-showcase-visual/);
  assert.match(game, /battle-showcase-copy/);
  assert.doesNotMatch(game, /battle-showcase-detail/);
  assert.match(css, /\.battle-showcase-layout\s*\{[^}]*grid-template-columns:[^;}]+/s);
  assert.match(css, /\.battle-showcase-visual \.battle-showcase-card \.card\.full-face-card\s*\{[^}]*aspect-ratio:\s*3\s*\/\s*4/s);
  assert.match(css, /\.battle-showcase-card \.card-face-image\s*\{[^}]*object-fit:\s*contain/s);
  assert.match(css, /\.battle-showcase-effect\s*\{[^}]*overflow-y:\s*auto/s);
});

test("手机横屏沿用两栏并允许右侧效果独立滚动", () => {
  assert.match(css, /html\.compact-landscape \.battle-showcase-layout,[\s\S]*grid-template-columns:\s*clamp\(116px,\s*24vw,\s*158px\)\s+minmax\(0,\s*1fr\)/);
  assert.match(css, /html\.compact-landscape \.battle-showcase-effect,[\s\S]*overflow-y:\s*auto/);
  assert.match(css, /html\.compact-landscape \.battle-showcase-visual \.battle-showcase-card \.card\.full-face-card/);
});
