# 执行与验证

- `DuelGame` 支持传入已校验的自定义预设对象，保持现有预设卡组兼容。
- 自定义牌组保存键：`waves-duel-custom-decks-v1`；仅保存牌组名称、3 名角色和行动牌数量，不保存对局或密钥数据。
- `node --check demo/game.js`、`node --check demo/core.js`：通过。
- `node --test tests/game.test.cjs`：25 通过，0 失败，覆盖自定义预设进入对局。
- `node --test tests/card-library.test.cjs`：3 通过，0 失败。
