# 手机版 PVP 先后手与性能优化

## 结果

- 系统随机产生先后手决定方；只有决定方显示先手/后手按钮，另一方只读显示自己的对应顺序。
- 决定方可在确认准备前切换选择；另一方通过 Realtime 立即看到“先手/后手”随之反转。决定方确认后选择锁定。
- 决定方换卡区域正上方新增蓝色发光提示框，明确告知其拥有先后手决定权。
- 操作方不再在权威指令成功后额外请求完整状态；对手端直接消费 Realtime 的新投影视图，异常或缺少视图时才回退到完整刷新。
- 52 张在线卡面新增 WebP：总计从 68,392,067 字节降至 5,371,200 字节，减少 92.15%；原 PNG 全部保留。
- 新增 Supabase/Turnstile/CDN 预连接、非关键列表图片懒加载和卡库浏览器缓存。
- Supabase Edge Function 与 Cloudflare Pages 已部署；正式站版本为 `09e42eec`，稳定地址为 `https://wuthering-waves-duel-mobile.pages.dev`。
- 正式站 6 张真实卡牌冷加载抽样：WebP 682,462 字节、约 998ms；同卡 PNG 8,658,774 字节、约 6,028ms。单次网络耗时会波动，资源体积减少 92.12% 是稳定结果。

## 边界

- Supabase 仍位于新加坡；本轮没有迁移数据库、修改 DNS、域名、密钥或 Turnstile 配置。
- 自定义 Cloudflare 域名只改变访问域名，不会把 Supabase 或 Pages 自动迁入中国大陆。

## 备份

- 修改前完整备份：`archives/backups/mobile-20260820-123409-pre-pvp-initiative-performance/`。
- 新版分享包：`releases/share-packages/mobile/builds/鸣潮对决-手机版-20260820-134104.zip`。
- 日期归档：`releases/share-packages/mobile/archive/2026-08-20/手机版/鸣潮对决-手机版-20260820-134104.zip`。
- 两份 ZIP 均含 246 个文件，SHA-256 均为 `BB3F175585C1510910B4934C2635BA9711A0A5C85008F55F48C18BB9CDA60978`。
