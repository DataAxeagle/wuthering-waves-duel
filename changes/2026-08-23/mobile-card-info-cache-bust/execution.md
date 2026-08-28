# 执行记录

## 根因证据

- 正式站点卡牌目录脚本与 WebP 卡面请求均返回 200，资源没有丢失。
- 腾讯云 Nginx 对 JS/CSS 返回 `Cache-Control: max-age=604800`，即缓存 7 天。
- `ai-axeagle.com` 曾用于旧项目，本次又连续切换多个游戏版本；未带版本参数的同名 `game.js`、`catalog.js`、CSS 会被手机浏览器继续复用，形成 HTML/脚本混版。
- 线上日志还发现旧单机存储接口返回 405，但相关调用均有异常降级，不是卡牌信息空白的直接原因，本次未扩展修改范围。

## 修改

- `mobile/index.html`
  - `manifest.webmanifest`、`styles.css`、卡库、核心逻辑、PVP 兼容层和 `game.js` 统一增加 `?v=20260823-1910`。
- `mobile/pvp.html`
  - `pvp.css`、卡库、核心逻辑、PVP 客户端脚本统一增加相同版本参数。
- `tests/pvp.test.cjs`
  - 允许 PVP 战场脚本携带版本参数。
- `tests/static-cache-busting.test.cjs`
  - 校验首页与好友 PVP 页所有核心资源使用同一版本参数。
- `tests/tencent-card-info-live.test.mjs`
  - 通过正式域名校验版本化资源、60 张卡库和卡牌详情渲染函数。

## 本地验证

- 核心、卡库、PVP、弹窗和缓存测试：75/75 通过。
- 响应式布局：7 个视口通过。
- PVP 手机横屏：844×390、667×375 通过。
- 设备 UI：21 个手机页面状态、3 个桌面视口通过。
- 卡牌图鉴与战斗详情滚动：通过，控制台错误 0。

## 打包校验

- 完整包：269 个 ZIP 条目，SHA-256 `2E9D364F5180C4EE550A9E1A7D0D9659768D324EB477CED3B0DB97D89188711C`。
- 精简包：83 个 ZIP 条目，SHA-256 `BFCF5A45FF95727698069E50AADF27F05AECEE74D67167160E60D35848B466A8`。
- 两个构建包与 `archive/2026-08-23/手机版/` 对应副本 SHA-256 一致。
- 腾讯云 `tar.gz`：94 个文件，SHA-256 `9DDE50F26E6018C39E02A153B14F03BE68E786ADDA35E42B9DC1C32A8133C4DF`。

## 部署与正式站点验证

- 新静态版本：`/opt/waves-duel/releases/20260823-191600/mobile`。
- 仅切换静态 `mobile` 目录；PVP 后端、SQLite 数据库和 Cloudflare 回滚版本未修改。
- 正式首页、`catalog.js?v=20260823-1910`、`game.js?v=20260823-1910` 均返回 200。
- 正式域名卡牌信息验收：2/2 通过，确认 60 张卡数据和详情渲染函数可读。
- 正式域名双人联机验收：2/2 通过。
- `nginx` 与 `waves-duel-pvp` 均为 `active`。
- 服务器 `index.html`、`pvp.html` SHA-256 与本地源码一致；部署前备份和新版本均为 82 个运行时文件。
- 本机自动化 Chrome 受本机代理影响访问正式域名时返回 `ERR_CONNECTION_CLOSED`；本地真实浏览器交互测试与服务器正式 HTTPS/WSS 验收均已通过，该代理问题未作为线上服务故障处理。
