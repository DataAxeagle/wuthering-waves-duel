# 鸣潮对决手机版

这是与电脑端 `../demo/` 完全隔离的 iPhone 横屏单机版源码目录。

- Cloudflare Pages 的静态发布根目录应选择本目录 `mobile/`；同级 `../functions/api/` 是 Pages Functions 后端（Wrangler 必须从项目根目录执行部署）。
- 电脑调试时打开 `preview.html`，它嵌入真实的 iPhone 15 Pro 横屏尺寸（844×390）。
- 手机版默认使用浏览器内置本地规则 AI。填写 DeepSeek Key 后，Key 只保留在当前页面内存并通过 HTTPS 发给同源 Function 代理；Function 不记录、不保存该 Key。
- 手机 UI、触屏交互和移动端资源仅在本目录修改；不要改动 `../demo/`。

## 自组卡组构筑规则

- 角色卡逐张加入：同名角色的不同等级、不同效果卡可共存；同编号角色卡最多 1 张。
- 角色卡须为 3–15 张，且恰好覆盖 3 名角色；每名角色至少需要 1 张 Lv.0。
- 行动卡须为 40 张，同编号最多 3 张；专属行动卡只有在其对应角色已被选入角色卡组时才能加入。
- 旧版仅保存 `heroIds` 的自组卡会在读取时自动迁移为该三名角色原有的完整 Lv.0–Lv.2 角色卡集合，原有角色卡不会丢失。

## 好友 PVP

- 主菜单新增“好友 PVP”，`pvp.html` 只作为组房大厅；双方准备后跳转到原 `index.html?pvp=1` 战场，画面、卡牌动画、操作控件和规则均复用单机版，仅由远端玩家替换 AI。现有单人 AI、存档和测试场不变。
- 双方可创建/加入六位房间号、分享邀请链接，并选择本机预组或自组卡组。
- PVP 使用 Supabase 匿名身份、Realtime、Postgres 和 Edge Function；完整牌局只在服务端保存，客户端只能读取自己的脱敏视图。
- 对手手牌、牌库顺序、未翻开的角色和盖牌不会发送给另一方；所有动作由服务端规则核心校验。
- 刷新和短时断线会按本机恢复令牌回到原席位；掉线满 5 分钟后，在线方可以确认判胜。
- 一局一房，结束后不能再战；新局需要重新创建房间。
- 公开前端配置位于 `pvp-config.js`，只允许填写 Supabase Project URL、publishable key 和 Turnstile site key，禁止填写任何服务端密钥。
- 后端部署步骤见 `../supabase/README.md`。配置为空时，PVP 页面会明确提示“后端尚未配置”，不会影响单人版。
- 对局指令成功响应会直接应用服务端返回视图；对手端直接使用 Realtime 推送的投影视图，不再为每个动作额外请求一次完整状态。
- 在线卡库使用 `card-library/art/` 下的 WebP 版本；原 PNG 保留用于素材回退。运行 `node ../scripts/optimize-mobile-card-assets.mjs` 可从原 PNG 重新生成 WebP 并同步手机版卡库索引。

## 手机版交付归档规则（强制）

每次完成一轮 `mobile/` 功能改动并对用户交付时，必须按以下顺序完成，不得只留源码备份：

1. 先创建完整源码备份：`../archives/backups/mobile-YYYYMMDD-HHMMSS/`。
2. 打出独立安装包：`../releases/share-packages/mobile/builds/鸣潮对决-手机版-YYYYMMDD-HHMMSS.zip`。
3. 原包保留不覆盖，并复制一份到日期归档：`../releases/share-packages/mobile/archive/YYYY-MM-DD/手机版/`。
4. 核对 ZIP 条目数与两个 ZIP 的 SHA-256 一致后，才可称为“已交付”。

仅做检查、讨论或未完成的中间修复时，可以不打包；只要向用户声称本轮手机版可使用、可下载、可部署或已完成，就必须执行以上四步。
