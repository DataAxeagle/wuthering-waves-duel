# 桌面版 AI 追击异常解锁修复

## 修复内容

- `demo/game.js` 的 AI 盖牌响应与完整 AI 回合均纳入 `try/catch/finally`。
- 任一 AI 决策、规则执行或动画异常时，隐藏动画场景；若追击权属于 AI，则调用 `endPursuit(1)` 安全结束追击。
- `finally` 无条件恢复 `aiRunning`、`uiLocked` 和 AI 状态文字；异常后若仍轮到 AI，则异步恢复调度。

## 未改动

- 未调整卡牌效果、战斗顺序、AI 策略、数值、UI 或发布包。
