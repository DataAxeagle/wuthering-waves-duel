# 执行记录

1. 修改前完整复制 `mobile/` 到时间戳备份目录，并核对 264 个源文件与备份文件。
2. 以 `releases/share-packages/desktop/builds/鸣潮对决-分享版-20260820-215325.zip` 的 `app/demo/` 为桌面视觉参考，只移植排版，不替换手机版规则、PVP 或触控逻辑。
3. 修复自组卡组 UI/core 构筑规则不一致、教程期间配置竞态和构造异常无恢复的问题。
4. 新增默认关闭的教程复选框；改造 Turnstile 显式加载、过期回调隔离、手动重试和失效会话恢复。
5. 新增手机功能页紧凑样式和电脑 `desktop-ui` 样式层，所有桌面覆盖均使用 `html.desktop-ui` 前缀。
6. 验证：
   - `node --check mobile/game.js`：通过。
   - `node --check mobile/pvp.js`：通过。
   - `node --test tests/mobile-core.test.cjs tests/pvp.test.cjs tests/card-library.test.cjs`：33/33 通过。
   - `node tests/check-device-ui-layout.mjs`：21 个手机功能页状态、3 个电脑视口通过。
   - `node tests/check-responsive-layout.mjs`：7 个通用视口、2 个 PVP 手机视口、1 个先后手提示视口通过。
7. 打包与校验：
   - 完整包 265 条目，303,654,903 字节，SHA-256 `7FE18F03DA0E817B843E6019A9566CADD566885D5632D4747ADAB1DA29325934`。
   - 精简包 81 条目，22,329,228 字节，包含 `pvp-game.js`，SHA-256 `DFB45D7D6E2CAB1AD715245912045A344C8F2B118829444CC6155BA4BB0F9150`。
   - 两个 ZIP 均逐条目完整读取通过，归档副本哈希一致。
