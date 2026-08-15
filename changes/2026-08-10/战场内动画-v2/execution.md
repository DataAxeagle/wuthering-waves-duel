# 执行记录

## 调整

- `demo/index.html`：新增中央常驻拼牌区域。
- `demo/game.js`：盖牌动画改为更新中央场地区域；AI 操作之间增加 0.8–0.95 秒停顿。
- `demo/styles.css`：动画层改为透明；回应窗口缩至右下角；放大最终翻牌卡面。

## 自动验证

- `node --check demo/core.js`：通过。
- `node --check demo/game.js`：通过。
- `node --check server.js`：通过。
- `node --test tests/game.test.cjs`：15/15 通过。

## 验收边界

- 按用户要求停止继续生成浏览器截图。
- 最终动画节奏和手感由用户亲自试玩确认。
