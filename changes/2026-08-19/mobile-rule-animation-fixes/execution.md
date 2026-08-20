# 执行记录

## 修改文件

- `mobile/core.js`：补齐规则、回合结束事件和动画触发数据。
- `mobile/game.js`：消费触发数据，播放角色/卡牌效果与回合结束动画。
- `tests/mobile-core.test.cjs`：新增手机版核心规则回归。

## 验证

- `node --check mobile/core.js`：通过。
- `node --check mobile/game.js`：通过。
- `node --test .\\tests\\mobile-core.test.cjs`：2/2 通过。
- `node --test .\\tests\\game.test.cjs`：29/29 通过。
- CDP 浏览器加载：`mobile/index.html`、核心规则库与 52 张卡牌均成功加载，未发现页面级错误。
