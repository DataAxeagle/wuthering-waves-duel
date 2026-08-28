# 腾讯云同源联机后端

该目录用于把手机版静态资源、PVP API 与 WebSocket 实时通知部署到同一腾讯云大陆服务器。当前 Cloudflare/Supabase 线上版在新站验证前保持不变。

## 架构

- OpenResty/Nginx：直接提供 `mobile/` 静态资源并终止 HTTPS。
- Node.js 24：提供匿名短期身份、权威房间 API 和 `/ws` 实时通知。
- Node 内置 SQLite：保存房间、成员、完整权威牌局和顺序动作回执；客户端仍只能读取按席位脱敏的投影视图。
- 客户端通过 `mobile/pvp-client-shim.js` 兼容原 Supabase 客户端调用，不修改战斗 UI 和动画队列。

## 本机验证

```powershell
cd tencent-server
npm install
$env:PVP_SESSION_SECRET = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
npm start
```

访问 `http://127.0.0.1:8787/`。同一局域网手机测试时，将 `HOST` 设为 `0.0.0.0`，并设置固定的 `PVP_SESSION_SECRET`。

## 生产约束

- `.env` 只在服务器创建，不进入源码、安装包、日志或变更记录。
- Node 只监听 `127.0.0.1:8787`，公网仅开放 Nginx 的 80/443。
- SQLite 数据目录为 `/opt/waves-duel/data`，发布新版前必须备份数据库和当前部署目录。
- 域名 `ai-axeagle.com` 在腾讯云接入备案与 HTTPS 验证完成前，不解除 Cloudflare Pages 的旧绑定。
- 新站通过两台真实手机的完整 PVP 回归后，才把根域名 DNS 切到腾讯云公网 IP。

## 部署包格式

运行 `scripts/build-tencent-deploy.ps1` 会同时生成 ZIP 和 `tar.gz`。Windows 留档可使用 ZIP；上传 Linux 服务器必须优先使用 `tar.gz`，以保留卡图目录和卡背文件的 UTF-8 中文路径。`install-first.sh` 同时接受两种格式，但生产部署默认使用 `tar.gz`。
