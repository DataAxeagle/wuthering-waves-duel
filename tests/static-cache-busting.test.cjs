const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

function html(name) {
  return fs.readFileSync(path.join(root, "mobile", name), "utf8");
}

test("首页核心脚本与样式使用同一版本参数，避免客户端混用新旧资源", () => {
  const source = html("index.html");
  const version = source.match(/styles\.css\?v=([0-9-]+)/)?.[1];
  assert.ok(version, "styles.css 应带版本参数");
  for (const asset of [
    "manifest.webmanifest",
    "card-library/catalog.js",
    "card-library/presets.js",
    "core.js",
    "pvp-config.js",
    "pvp-client-shim.js",
    "pvp-game.js",
    "game.js",
  ]) {
    assert.match(source, new RegExp(`${asset.replaceAll(".", "\\.")}\\?v=${version}`), `${asset} 应使用版本 ${version}`);
  }
});

test("好友 PVP 入口与游戏首页使用相同版本参数", () => {
  const index = html("index.html");
  const lobby = html("pvp.html");
  const version = index.match(/styles\.css\?v=([0-9-]+)/)?.[1];
  assert.ok(version);
  for (const asset of ["pvp.css", "card-library/catalog.js", "card-library/presets.js", "core.js", "pvp-config.js", "pvp-client-shim.js", "pvp.js"]) {
    assert.match(lobby, new RegExp(`${asset.replaceAll(".", "\\.")}\\?v=${version}`), `${asset} 应与首页使用同一版本`);
  }
});
