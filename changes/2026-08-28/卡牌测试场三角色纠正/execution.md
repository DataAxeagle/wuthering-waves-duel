# 执行记录

## 备份

- 纠正前文件备份：`archives/backups/mobile-test-lab-three-role-correction-20260828-001910/`
- 纠正前完整手机版备份：`archives/backups/mobile-20260828-001910/mobile/`
- 关键文件 SHA-256 已核对一致。

## 验证

- `node --check mobile/game.js`：通过。
- 定向规则测试：73 / 73 通过。
- 852 × 343 真实浏览器流程：自动模式锁定炽霞；场上 3 名角色；提供 6 个替换候选；替换为安可后仍为 3 名角色；角色牌库 32 张；无页面横向溢出。
- 完整版：291 个文件条目，SHA-256 `988AEB7479773C75CA7124CEB70A44EA506039496C278B3396739233CCA62B1E`。
- 精简版：95 个文件条目，SHA-256 `851D9B17E85D491EFCCBC1043F63853181EFFDC55531F55A5106988E199D5112`。
- 两个 `builds/` 包与 `archive/2026-08-28/手机版/` 副本哈希分别一致。
