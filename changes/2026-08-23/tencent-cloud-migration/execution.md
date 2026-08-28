# 执行与验证记录

## 备份

- 迁移前备份覆盖 `mobile/`、`supabase/`、`functions/` 与 `PROJECT.md`：284 个文件、307,388,699 字节，源与备份计数/字节一致。
- `tests/pvp.test.cjs` 修改前单独补充备份并核对 SHA-256。
- 强制手机版备份从迁移前快照复制：264 个文件、307,329,912 字节，源与备份一致。

## 实现

- 新增 `mobile/pvp-client-shim.js`，在不改战斗 UI/动画队列的前提下兼容原 Supabase 客户端调用方式。
- `mobile/pvp-config.js` 改为同源腾讯云后端；PVP 页面移除 Supabase CDN 与 Turnstile 依赖。
- 新增 `tencent-server/`：匿名签名会话、权威房间 API、WebSocket 通知、SQLite WAL 持久化、按席位脱敏视图、版本号与动作幂等、顺序动作回执。
- Nginx 同源提供静态资源、API 与 WSS；systemd 使用低权限 `wavesduel` 用户运行 Node 服务。
- 新增首次部署脚本，执行安装包 SHA-256 校验、版本化解压、Nginx 原配置备份、生产密钥服务器内生成及服务健康检查。
- Windows ZIP 在 Ubuntu `unzip` 下会破坏中文卡图路径；部署工具已改为同时输出 ZIP 与 UTF-8 `tar.gz`，Linux 安装脚本优先接受 `tar.gz`。

## DNS 与 HTTPS

- Cloudflare 根记录由 `CNAME my-ai-images.pages.dev / Proxied` 改为 `A 49.234.54.14 / DNS only`。
- 腾讯公共 DNS 与阿里公共 DNS 均确认解析到 `49.234.54.14`。
- HTTP 返回 301 到 HTTPS；HTTPS 返回 200，并包含 HSTS。
- 正式浏览器页面的资源来源仅为 `https://ai-axeagle.com`。

## 自动化验证

- 迁移实现阶段相关测试 72/72 通过；最终核心规则与联机套件 70/70 通过。
- 正式域名双人后端回归：2/2 通过，覆盖创建、加入、WebSocket 通知、双方准备开局、隐藏手牌、先后手动作、幂等重试、事件补取、离房结束与恢复令牌。
- 正式 HTTPS 双人回归总耗时约 1.27 秒。
- 浏览器实测：好友 PVP 页面标题正确、创建/加入按钮可用、显示“无需人机验证”、实时连接成功、建房成功。
- 腾讯匿名会话持久化通过：首次只建立一次身份，往返首页后用户 ID 保持一致。
- 腾讯精简运行时线上逐文件校验 81/81 哈希一致；高并发 8 路校验曾因 3Mbps 带宽拥塞终止 3 个大文件，单连接校验全部通过。
- 布局验证覆盖 7 个通用视口、21 个手机页面状态、3 个桌面视口；卡牌图鉴与战斗详情长文本滚动通过。
- 服务健康：PVP 与 Nginx 均为 active；8787 仅回环监听；上线阶段无 warning 级服务日志。

## 发布包校验

- 完整包：269 个 ZIP 条目；SHA-256 `E1703F112D1F02AF280D9DC1B582B19CEA89BEB4AFD97EDCD6C5DB6BDF121690`。
- 上传精简版：83 个 ZIP 条目；SHA-256 `5C8F18986F7117D637B7A2ECA81F69CE16CC4C3EC543A0EA4825EBF9B8AB23A2`。
- 两个 `builds/` 包与 `archive/2026-08-23/手机版/` 对应副本哈希一致。
- 最终腾讯云 `tar.gz` 部署包：94 个文件，SHA-256 `398443E872E2E886DE42FD54211E7DAD4B96CA2285F3E39BD753710EBB86F878`。
