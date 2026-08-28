# 腾讯云同源 PVP 迁移

## 结果

- 线上主站已从 Cloudflare Pages 自定义域名切换到腾讯云上海轻量应用服务器：`https://ai-axeagle.com`。
- 好友 PVP 已改为同源 Node.js + SQLite 权威后端，静态资源、REST API 与 WebSocket 均由同一域名提供。
- Cloudflare Pages 与原 Supabase 实现未删除，保留为回滚来源；`ai-axeagle.com` 当前 DNS 为直连腾讯云的 DNS only A 记录。
- 单人 AI、手机版战场 UI、卡库与动画规则未改为远程逻辑；本次迁移只替换好友 PVP 的线上承载与客户端连接层。

## 生产信息

- 腾讯云实例：`lhins-o522g8qo`，公网 IPv4 `49.234.54.14`，Ubuntu 24.04 LTS。
- 公网端口：80/443；Node PVP 服务仅监听 `127.0.0.1:8787`。
- HTTPS：Let's Encrypt，首次证书到期日 `2026-11-21`，Certbot 自动续期已启用。
- 生产密钥与 SQLite 数据只保存在服务器，不进入源码、发布包或变更记录。

## 交付物

- 完整包：`releases/share-packages/mobile/builds/鸣潮对决-手机版-20260823-174110.zip`
- 上传精简版：`releases/share-packages/mobile/builds/鸣潮对决-手机版-上传精简版-20260823-174110.zip`
- 腾讯云部署包：`output/导出/2026-08-23/鸣潮对决-腾讯云部署包-20260823-175936.tar.gz`，用于 Linux 服务器复现部署，不替代手机版正式归档；同时间戳 ZIP 仅用于 Windows 留档。
- 修改前备份：`archives/backups/tencent-cloud-migration-20260823-155023/`
- 手机版强制备份：`archives/backups/mobile-20260823-155023/`

## 回滚边界

- Cloudflare 原根域记录基线为 `CNAME my-ai-images.pages.dev`、代理开启；需要回滚域名时可按该值恢复。
- 腾讯云服务器上的 Nginx 初始配置和 HTTPS 前配置均保留了带时间标识的备份。
- 首次 ZIP 解压产生的中文路径乱码已通过 UTF-8 tar 叠加修复；修复前静态目录保存在服务器 `/opt/waves-duel/backups/20260823-175200-utf8-static-fix/`。
- 未删除 Cloudflare Pages 项目、Supabase 项目或其源码。
