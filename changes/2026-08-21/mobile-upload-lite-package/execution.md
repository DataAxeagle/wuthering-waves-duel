# 执行记录

1. 创建修改前完整备份：`archives/backups/mobile-20260821-192857-pre-upload-package-optimization/mobile`。
2. 对手机版资源做只读审计：完整 ZIP 的主要体积来自未使用旧 `demo/` 与 PNG 备份。
3. 生成独立上传精简包：`releases/share-packages/mobile/builds/鸣潮对决-手机版-上传精简版-20260821-193355.zip`。
4. 单独归档到：`releases/share-packages/mobile/archive/2026-08-21/手机版/`。
5. SHA-256：`40EC91655520752248E4591AC549C4D0CE4F906EA33836F880614CED6A8FB719`；归档副本一致。
6. 回归：`node --test tests/mobile-core.test.cjs tests/pvp.test.cjs`，30/30 通过。
