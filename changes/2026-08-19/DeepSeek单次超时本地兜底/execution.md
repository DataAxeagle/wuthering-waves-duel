# 验证记录

- `node --check demo/game.js` 与 `node --check server.js`：通过。
- `node --test tests/game.test.cjs`：26 通过，0 失败。
- `node --test tests/card-library.test.cjs`：3 通过，0 失败。
- 静态检查：客户端 10 秒常量、桌面/HTTP 共用 Promise 超时保护、HTTP 中止、单次兜底提示和服务端 10 秒超时均存在。
- 未进行真实 DeepSeek 网络超时演练，避免为验证消耗用户 API 调用。
