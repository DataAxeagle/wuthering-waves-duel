# 执行记录

## 备份

`archives/backups/手机版20260828新增卡牌玩法回迁-20260828-011500/`

已保存修改前的桌面规则核心、交互层、卡表和既有规则测试。

## 验证

```powershell
node --check .\demo\core.js
node --check .\demo\game.js
node --check .\demo\card-library\catalog.js
node --test .\tests\game.test.cjs
node --test .\tests\desktop-new-entity-cards.test.cjs
```

结果：既有桌面规则 42/42、新增实体卡规则 8/8 通过。
