# 验证记录

- `node --check demo/game.js`：通过。
- `node --test tests/game.test.cjs`：26 通过，0 失败。
- `node --test tests/card-library.test.cjs`：3 通过，0 失败。
- 静态覆盖检查：新卡背 CSS 共 4 处引用，覆盖场上/角色暗置/盖牌/抽卡四类背面类；抽卡与盖牌不再渲染旧的背面符号或文字；牌堆下方说明共 3 处；弃牌悬停动效存在。
- 浏览器视觉检验：按用户此前要求跳过。
