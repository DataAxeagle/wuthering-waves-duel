# 执行与验证

## 修改范围

- `demo/core.js`：新增待结算伤害事件、`commitDamage()`；移除结算阶段的即时扣血。
- `demo/game.js`：掉血动画结束后才提交对应伤害事件并刷新界面。
- `tests/game.test.cjs`：覆盖对抗、连击换位和支付费用三种延后扣血路径。

## 自动验证

```powershell
node --test .\tests\game.test.cjs .\tests\card-library.test.cjs
```

结果：23/23 通过。
