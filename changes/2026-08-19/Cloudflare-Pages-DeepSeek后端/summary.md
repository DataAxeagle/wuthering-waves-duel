# Cloudflare Pages 与 DeepSeek 后端

- Pages 项目：`wuthering-waves-duel-mobile`
- 静态发布目录：`mobile/`
- Functions 源码：`functions/api/`
- 生产部署：`https://wuthering-waves-duel-mobile.pages.dev`
- 最新生产部署 ID：`ef7faa3d`。

## 2026-08-20 屏幕适配设置部署

- 新生产部署 ID：`ef7faa3d`。
- 部署别名：`https://ef7faa3d.wuthering-waves-duel-mobile.pages.dev`。
- 稳定生产域名：`https://wuthering-waves-duel-mobile.pages.dev`。
- 新增自动推荐及 16:9、19.5:9、20:9 三档横屏适配；没有改动 Pages Functions、Supabase、密钥、域名或 Turnstile 配置。
- 稳定域名首页、PVP 页面和 `/api/status` 返回 200，线上三档视口回归全部通过。

## 2026-08-20 手机版追击解锁部署

- 继续使用原 Pages 项目 `wuthering-waves-duel-mobile` 和稳定域名，没有改动账号、域名、API Key 或 CI 配置。
- 新部署别名：`https://6f3f1c04.wuthering-waves-duel-mobile.pages.dev`
- 稳定生产域名：`https://wuthering-waves-duel-mobile.pages.dev`
- 线上 `game.js` 已确认包含三条对抗入口统一解锁、12 秒空闲看门狗、35 秒自动展示硬看门狗，并保留 DeepSeek 10 秒决策超时。
- 生产 `/api/status` 返回 200，Pages Functions 可用。

## 2026-08-19 手机版追击修正版部署

- 继续使用原 Pages 项目、原稳定域名与原 Pages Functions 后端，没有改动域名、账号、密钥或 CI 配置。
- 新部署别名：`https://1d612701.wuthering-waves-duel-mobile.pages.dev`
- 稳定生产域名：`https://wuthering-waves-duel-mobile.pages.dev`
- 线上 `game.js` 已确认包含 DeepSeek 10 秒超时兜底和追击决策调用；生产 `/api/status` 返回 200，Functions 状态可用。

## 安全边界

玩家填写的 DeepSeek Key 不进仓库、不进 Cloudflare Secret、不进浏览器持久化存储，也不写入对局/决策日志。页面仅在当前会话内存保存它；每次 AI 决策将 Key 经同源 HTTPS 请求交给 Pages Function，Function 立即转发至 DeepSeek，完成后不保留。

因此，刷新页面或关闭标签页后必须重新填写 Key。公开 Function 不持有任何平台统一 DeepSeek Key，也不会产生项目方的模型费用。

## 验证

- Wrangler 已成功编译并上传 Functions bundle。
- 生产 `GET /api/status` 返回服务与模型信息。
- `POST /api/configure-ai` 对无效 Key 返回 400；对格式合法的测试字符串返回浏览器会话模式。
- 未使用真实 DeepSeek Key 发起调用，避免消耗用户额度。
