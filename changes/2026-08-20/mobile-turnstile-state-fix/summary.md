# 手机版 PVP 人机验证状态修复

## 结果

- Turnstile 未完成前，“创建房间”和“加入房间”按钮保持禁用，不再允许用户先点击后才收到泛化提示。
- 页面明确展示“加载中、请完成验证、验证成功、加载失败、超时、过期、浏览器不支持”等状态。
- 加载失败、超时或 token 失效时显示“重新加载验证”按钮。
- 浏览器已有有效 Supabase 匿名身份时直接开放房间按钮，不重复要求验证。
- 只修改 PVP 大厅前端；单机模式、原战场、卡牌规则和 Supabase 后端不变。
- 已发布到 Cloudflare Pages 正式站 `https://wuthering-waves-duel-mobile.pages.dev`，部署版本 `7e43cbbe`。

## 备份

- 修改前完整备份：`archives/backups/mobile-20260820-120033-pre-turnstile-state-fix/`，共 194 个文件。
- 最终安装包：`releases/share-packages/mobile/builds/鸣潮对决-手机版-20260820-120712.zip`，共 194 个条目；手机版日期归档副本 SHA-256 一致：`87EDDEDF35DA23494D88185E5FE1053BABC0473DD606E6CE76CAD38EB80B3789`。
