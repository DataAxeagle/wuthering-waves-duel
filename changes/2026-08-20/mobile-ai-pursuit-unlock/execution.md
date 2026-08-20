# 执行与验证

- 修改前手机版源码备份：`backups/mobile-20260820-002848/`，189 个文件。
- `node --check mobile/game.js`：通过。
- `node --test .\tests\mobile-core.test.cjs`：5/5 通过；新增三条对抗入口必须共用异常解锁与续跑看门狗的回归约束。
- `node --test .\tests\game.test.cjs`：32/32 通过。
- 真实横屏正常路径：我方绿色卡触发漂泊者抽 2 张，AI 红牌获胜后完成 2 次追击，随后停止追击并启用玩家“结束回合”按钮；页面异常 0。
- 真实横屏故障注入：人为令效果展示抛错，异常被捕获，操作锁释放，AI 继续追击并正常停止；未产生未捕获异常。

## 独立交付包

- 新手机版包：`output/鸣潮对决-手机版-20260820-003520.zip`。
- 手机版单独归档：`output/导出/2026-08-20/手机版/鸣潮对决-手机版-20260820-003520.zip`。
- ZIP 共 195 项，其中 189 个文件与 `mobile/` 源码逐项一致，无缺失、无额外文件。
- 两个 ZIP 的 SHA-256 一致：`990C9201F269258E94CF6F4813E3A986D44B96D70349B79F6FE0550ABA93F36B`。

## Cloudflare Pages 生产部署

- 沿用 Pages 项目 `wuthering-waves-duel-mobile`，发布 `mobile/` 并同时上传项目根目录现有 `functions/api/`。
- Wrangler 4.124.0 编译 Functions 成功；188 个静态资源完成核对，1 个更新文件上传、187 个复用。
- 新部署 ID：`6f3f1c04`；部署别名：`https://6f3f1c04.wuthering-waves-duel-mobile.pages.dev`。
- 稳定生产域名：`https://wuthering-waves-duel-mobile.pages.dev`。
- 线上 `game.js` 返回 200，统一解锁器、两级看门狗和 DeepSeek 10 秒规则均已确认；生产 `/api/status` 返回 200。
