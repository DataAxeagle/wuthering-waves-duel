# 执行与验证

## 素材

- 原始截图：`assets/input/entity-card-update-2026-08-27/`
- 裁切复核：`output/测试/2026-08-27/entity-card-ingest/crops/`
- 卡面总览：`output/测试/2026-08-27/entity-card-ingest/crop-montage.png`
- 游戏资源：`mobile/card-library/art/角色牌/`、`mobile/card-library/art/领队技/`
- PNG 保留原始裁切，WebP 用于在线加载；SAMPLE 水印未移除。

## 自动验证

- `node --check mobile/core.js`
- `node --check mobile/game.js`
- `node --test tests/game.test.cjs tests/mobile-core.test.cjs tests/mobile-new-entity-cards.test.cjs tests/pvp.test.cjs tests/tencent-pvp-server.test.mjs`
  - 结果：89/89 通过。
- `node --test tests/static-cache-busting.test.cjs tests/mobile-core.test.cjs tests/mobile-new-entity-cards.test.cjs tests/pvp.test.cjs`
  - 结果：49/49 通过。
- `node tests/check-responsive-layout.mjs`
  - 电脑 7 种视口通过。
  - PVP 大厅 844×390、667×375 通过。
  - 开局弹窗 844×390 通过。

## 浏览器技能边界

- 已按 browser-automation skill 先运行环境初始化。
- Chrome 9222 调试端口成功启动；技能缺少 `cdp-proxy.mjs`，未擅自安装全局依赖。
- 改用项目已有的直接 CDP 响应式测试完成同等浏览器检查，截图保存在 `output/测试/2026-08-27/entity-card-ingest/browser-qa/`。

## 交付包

- 完整版：`releases/share-packages/mobile/builds/鸣潮对决-手机版-20260827-230308.zip`
  - 293 个 ZIP 条目；72 张卡牌，72 PNG + 72 WebP。
  - SHA-256：`A69804BC6487745B6E5E1C19428D31F3E91BF4AE5829594F22A34418885BCF7F`
- 精简版：`releases/share-packages/mobile/builds/鸣潮对决-手机版-上传精简版-20260827-230308.zip`
  - 95 个 ZIP 条目；72 张卡牌，0 PNG + 72 WebP。
  - SHA-256：`A761296D0947991C5C66F14D966959BA0CC440DF5F32CBAA885A267911087A2F`
- 两个包均复制到 `releases/share-packages/mobile/archive/2026-08-27/手机版/`，构建包与归档副本哈希逐一一致。
- 12 张新增卡的必需 WebP 条目在两个包中均为 12/12 存在。
