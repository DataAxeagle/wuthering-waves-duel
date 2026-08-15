# 执行记录

## 代码调整

- `demo/core.js`：移除费用回合恢复；增加 `spendEnergy()`，支付时移动充能牌到弃牌区；拼牌结果返回双方卡牌、点数、克制和效果明细。
- `demo/game.js`：新增操作锁、两步升级交互、玩家/AI 共用动画队列，以及完整拼牌演出。
- `demo/styles.css`：新增卡牌移动、同时翻牌、效果面板、领队切换、角色升级、掉血震动与弃牌归档动画。
- `server.js`：同步一次性费用和后台角色升级规则给 DeepSeek。

## 验证

- `node --check demo/core.js`：通过。
- `node --check demo/game.js`：通过。
- `node --check server.js`：通过。
- `node --test tests/game.test.cjs`：15/15 通过。
- 浏览器：两步升级、弃牌计数、一次性费用归零、同时翻牌、双方效果文本、拼牌胜负和 AI 顺序行动通过。
