# 执行记录

## 修改范围

- `mobile/game.js`
  - 将胜负结算卡牌效果弹窗从上下堆叠改成 `.battle-showcase-layout` 两栏结构。
  - 左栏保留玩家名与完整卡面；右栏放结算结果和卡牌效果。
- `mobile/styles.css`
  - 增加桌面与手机横屏两栏布局、完整卡面尺寸约束和右侧长文本滚动。
  - 保持项目现有深色、青绿、金色视觉体系。
- `tests/check-battle-showcase-layout.mjs`
  - 增加桌面与手机横屏浏览器布局测量和截图。
- `tests/battle-showcase-layout.test.cjs`
  - 增加弹窗结构静态回归检查。
- `design-qa.md`
  - 记录参考图对比、尺寸、裁切、滚动和移动端验收结论。

## 本地视觉证据

- `output/测试/2026-08-23/battle-showcase-layout/battle-showcase-desktop-1440x900.png`
- `output/测试/2026-08-23/battle-showcase-layout/battle-showcase-mobile-844x390.png`
- `output/测试/2026-08-23/battle-showcase-layout/battle-showcase-reference-comparison.png`

## 包校验

- 完整包 SHA-256：`8F202F10E37B6DE00EE542E56512981B152C1B9DBAAB411CD5D33C7FA65DDF71`
- 精简包 SHA-256：`18BFB9E60A3DEA0764752F6CA35AD6A7E56FA5DF172226133AAE43798B0E6EC2`
- 腾讯云部署包 SHA-256：`1AC8C3393B3D1AF10B8B91AEAC5595FB96DB9DF869DD6D928AA6A4A1D5B8056F`
- 构建目录与归档目录中的精简包、完整包 SHA-256 均一致。

## 服务器部署与线上验证

- 部署时间：2026-08-23 18:40（Asia/Shanghai）。
- 仅切换 Nginx 使用的静态 `mobile` 目录；运行中的 PVP 后端、数据库和旧 Cloudflare 版本未改动。
- `nginx -t` 通过，`nginx` 与 `waves-duel-pvp` 均为 `active`。
- 正式域名通过服务器内 HTTPS/WSS 测试：建房、加入、实时通知、准备开局、幂等操作、离房与恢复令牌 2/2 通过。
- 正式域名 81 个运行时静态文件逐个 SHA-256 匹配；报告：`output/测试/2026-08-23/online-static-parity-tencent-server-20260823.json`。
- 正式服务器文件哈希：
  - `game.js`：`4CAA7497493CA3A198593926E379CD04B4F44A369A07D7FCE63544DEDCA069B5`
  - `styles.css`：`2EAA0BA98F1C00998B13BC9F9AF29C5F051507354835F8C5AE4B18F7142C41E5`
- 本机直连正式域名时受本机 `127.0.0.1:7897` 代理/TLS 链路影响出现连接重置；服务器内正式域名测试和逐文件线上校验均通过，故未把该现象归因于线上服务。
