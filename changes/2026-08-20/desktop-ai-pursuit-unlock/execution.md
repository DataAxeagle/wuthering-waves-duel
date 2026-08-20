# 执行与验证

- 新增 `tests/game.test.cjs` 回归约束：AI 盖牌与完整回合处理器必须同时具备异常追击结束和 `finally` 解锁。
- `node --check .\demo\game.js`：通过。
- `node --test .\tests\game.test.cjs`：36/36 通过。
- `node --test .\tests\mobile-core.test.cjs`：9/9 通过。

本次仅修复桌面源码，未创建或替换发布包。
