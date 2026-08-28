# 手机版连击牌限制与 Cloudflare 原版部署

## 结果

- 所有带 `【连击】` 的行动牌不能再作为普通对抗牌或响应对抗牌盖放，只能在获得追击权后使用。
- 同时带 `【领队技】` 与 `【连击】` 的行动牌必须同时满足当前领队为专属角色、当前处于追击阶段和费用足够。
- AI 的普通对抗候选也改为使用同一合法卡牌集合，不能再计划或尝试盖放连击牌。
- Cloudflare Pages 回滚站已更新；腾讯云主站、`ai-axeagle.com` DNS、PVP 数据库和服务均未修改。

## Cloudflare 部署

- Pages 项目：`wuthering-waves-duel-mobile`
- 生产部署：`c184eb2e-7fe2-4a97-ab78-2dc3c18703f1`
- 部署 URL：`https://c184eb2e.wuthering-waves-duel-mobile.pages.dev`
- 稳定 URL：`https://wuthering-waves-duel-mobile.pages.dev`

## 交付物

- 完整包：`releases/share-packages/mobile/builds/鸣潮对决-手机版-20260823-232605.zip`
- 精简包：`releases/share-packages/mobile/builds/鸣潮对决-手机版-上传精简版-20260823-232605.zip`
- 两包均归档到 `releases/share-packages/mobile/archive/2026-08-23/手机版/`。

## 备份

- `archives/backups/combo-restriction-cloudflare-20260823-232042/`
