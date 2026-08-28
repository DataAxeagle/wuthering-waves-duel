# 执行记录

1. 创建修改前备份：`archives/backups/mobile-20260821-021739-pre-ai-initiative-fix/mobile`。
2. 调整 `mobile/core.js` 的单机 AI 初始化顺序。
3. 移除 `mobile/game.js` 中已失效的重复 AI 选先后手调用。
4. 在 `tests/mobile-core.test.cjs` 增加 AI 获得决定权的回归测试。
5. 生成独立安装包与日期归档，两个 ZIP 均为 268 条目，SHA-256 均为 `156992703A886AB45417FEED433F177DDFAE2B8F56BB745F792045CB99ABB1FC`。
6. 发布 Cloudflare Pages 生产版本 `334c04f2-4736-48fc-b388-427b7f2d8b29`，并读取线上 `core.js` 核验自动选边修复存在。
