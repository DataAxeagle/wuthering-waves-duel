# 验证记录

- `node --check demo/game.js` 与 `node --check server.js`：通过。
- `node --test tests/game.test.cjs`：26 通过，0 失败。
- `node --test tests/card-library.test.cjs`：3 通过，0 失败。
- 静态检查：用户资料载荷包含自组卡组，服务端资料恢复自组卡组，保存卡组会触发资料同步，分享说明已更新。
- 浏览器视觉检验：未执行，不影响此存储逻辑变更。
