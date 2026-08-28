# 椿 Lv.2 再次升级回退

## 结论

- 椿从 Lv.1 首次升级到 Lv.2 时，弃置 2 张手牌，`BP01-002` 留在角色叠放区，领队技能持续有效。
- 椿已经是 Lv.2 时仍可再次升级；本次弃置 3 张手牌后，将 `BP01-002` 放回己方角色牌库，移除对应领队技能，并回到 Lv.1。
- 两次升级都占用本回合的常规升级次数。
- 单机、卡牌测试场与 PVP 共用同一核心规则，并已部署到 Cloudflare Pages 手机版镜像。

## 交付

- 完整版：`releases/share-packages/mobile/builds/鸣潮对决-手机版-20260828-010749.zip`
- 精简版：`releases/share-packages/mobile/builds/鸣潮对决-手机版-上传精简版-20260828-010749.zip`
- 修改前完整手机版备份：`archives/backups/mobile-20260828-005252/`
- 本次精确文件备份：`archives/backups/mobile-camellya-lv2-reupgrade-20260828-005252/`

## Cloudflare 部署

- Pages 项目：`wuthering-waves-duel-mobile`
- 生产部署：`3d6823c0`
- 部署地址：`https://3d6823c0.wuthering-waves-duel-mobile.pages.dev`
- 稳定地址：`https://wuthering-waves-duel-mobile.pages.dev`
- 线上验收证据：`output/测试/2026-08-28/cloudflare-camellya-deploy-verification.json`
