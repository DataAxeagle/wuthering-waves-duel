# 战斗响应与界面稳定性

## 交付

- 对方发起战斗后，玩家即使有可用行动卡，也能选择“不出牌”，直接判定发起方获胜。
- 对抗结算的手牌上限状态改为显式记录归属玩家；玩家会进入弃牌选择，AI 会自动弃置低评分手牌并推进回合。
- “查看对方手牌”和支付费用的弹窗收尾改为串行恢复，避免效果动画和后续回合流程并发。
- 棋盘、角色卡、手牌区及响应弹窗采用动态视口尺寸，手牌区不再使用固定 225px 偏移。
- 生成新的可分享包：`output/鸣潮对决-分享版-20260817-024532.zip`。

## 验证

- `node --check demo/core.js`
- `node --check demo/game.js`
- `node --test tests/game.test.cjs tests/card-library.test.cjs`：19/19 通过。
- 新包内 `server.js`、`demo/core.js`、`demo/game.js`、`demo/styles.css`、`demo/index.html` 均与当前源码 SHA-256 一致。
