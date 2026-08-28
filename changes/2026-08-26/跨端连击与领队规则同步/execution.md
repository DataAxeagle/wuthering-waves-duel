# 执行记录

## 备份

`archives/backups/手机版规则与桌面领队判定同步-20260826-000000/`

已保存修改前的桌面/手机版规则核心和对应测试文件。

## 验证

```powershell
node --check .\mobile\core.js
node --check .\demo\core.js
node --test .\tests\game.test.cjs
node --test .\tests\mobile-core.test.cjs
node --test .\tests\pvp.test.cjs
```

结果：桌面规则 40/40、手机版规则 24/24、PVP 前端 16/16 通过。
