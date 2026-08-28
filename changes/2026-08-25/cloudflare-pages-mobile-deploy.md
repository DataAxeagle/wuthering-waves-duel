# Cloudflare Pages 手机版生产部署

## 部署目标

- Pages 项目：`wuthering-waves-duel-mobile`
- 稳定地址：`https://wuthering-waves-duel-mobile.pages.dev`
- 本次部署地址：`https://94fdcbd2.wuthering-waves-duel-mobile.pages.dev`
- 发布内容：项目根目录的 `mobile/` 静态资源与既有 `functions/api/` Pages Functions。

## 发布包与备份

- 完整源码备份：`archives/backups/mobile-20260825-014541/`，265 个文件。
- 发布包：`releases/share-packages/mobile/builds/鸣潮对决-手机版-20260825-014541.zip`，269 个 ZIP 条目。
- 单独归档：`releases/share-packages/mobile/archive/2026-08-25/手机版/鸣潮对决-手机版-20260825-014541.zip`，269 个 ZIP 条目。
- 两个 ZIP SHA-256：`50B740B2B3F71F9F7314E2B02F437A318A160388E75F9E31BF3697B2CE5A0EAD`。

## Cloudflare 结果

- Wrangler 4.124.0：Worker 编译成功、264 个静态资源核对完成，其中 3 个更新、261 个复用。
- 新部署与稳定域名的 `game.js` 均返回 HTTP 200，并包含真实视口宽度补偿与紧凑横屏修复。
- 稳定域名 `/api/status` 返回 HTTP 200，Pages Functions 可用。

## 风险

- 本次仅完成线上资源与接口回查；真实 iPhone Safari 的最终触控体验仍需人工复测。
