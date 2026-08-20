# 鸣潮对决本地版

## 项目目标

制作一个零依赖、可直接在本地浏览器中运行的《鸣潮》同人卡牌对战原型。玩家可与电脑 AI 进行完整对局，AI 能遵守规则、进行基础出牌与对抗。

## 交付边界

- 规则依据：B 站 `BV1Boux6aEDK`《鸣潮：对决》新手规则教学及公开试玩资料。
- 已还原：抛硬币先手、双方 5 张起手、3 名角色暗置并选择领队、确认后同时翻开、先手首抽 1 张、后续每回合抽 2 张、充能/升级/更换领队各自每回合一次且均可跳过、可跳过的双方盖牌拼牌阶段；主角领队被动、红绿蓝循环克制、同色攻击速度判定、同时翻牌后扣费、攻击伤害和同色无限追击。
- 费用口径：充能区每张牌是 1 点一次性费用；支付后该牌进入弃牌区，不在回合开始恢复。
- 表现层：玩家与 AI 共用顺序动画队列，覆盖充能、支付、弃牌、升级、领队切换、盖牌、同时翻牌、效果、胜负与生命变化。
- 自制部分：完整卡表和逐卡效果尚待补全；现有数值、疲劳与手牌上限为电子原型的临时可玩化处理。
- 非商业同人原型，不使用官方卡面素材，不声称为官方产品。
- AI 模式：通过本地 Node 代理调用 DeepSeek Chat Completions；Key 只存在于服务端环境变量。接口不可用时保留本地规则 AI 降级路径。
- 好友 PVP：手机版新增独立 Supabase 权威房间模式。`pvp.html` 只负责创建/加入房间、选卡组和双方准备；开局后进入原 `index.html` 单机战场，复用相同画面、动画、规则和操作，仅把 AI 替换为远端玩家。房间、卡组、完整牌局和动作校验由服务端负责；客户端只接收按席位脱敏的视图。单人 AI 模式维持原实现。

## 运行方式

- DeepSeek AI：设置 `DEEPSEEK_API_KEY` 后运行 `run-deepseek-game.ps1`，访问 `http://127.0.0.1:4173`。
- 离线规则 AI：直接双击 `demo/index.html`。

## 验证命令

```powershell
node --test .\tests\game.test.cjs
```

## 目录与发布物治理

- `demo/`、`server.js`、`rules/`、`scripts/`、`tests/`：当前电脑端核心源码与验证入口，不放构建产物。
- `mobile/`：独立手机版源码与 Cloudflare Pages 配置。
- `assets/card-art/`、`assets/input/`：原始卡面和输入素材；运行时统一从已裁剪的 `demo/card-library/` 读取。
- `packaging/desktop-exe/`：桌面 EXE 封装开发子项目；不是对外下载包目录。
- `releases/stable-desktop/`：稳定桌面版交付目录。
- `releases/share-packages/desktop/builds/`：桌面分享包的目录版和 ZIP；`desktop/legacy/`：历史 Windows ZIP。
- `releases/share-packages/mobile/builds/`：手机版安装 ZIP；`mobile/archive/YYYY-MM-DD/手机版/`：按日期保留的交付归档。
- `archives/backups/`：源码备份；`archives/pre-change/`：修改前快照。两者都不作为当前源码或发布包使用。
- `output/`：仅保留临时运行、测试或一次性导出内容，禁止再存放可交付安装包。

## 发布工作流

- 桌面分享包：运行 `打包分享版.ps1`；脚本会将目录版和 ZIP 写入 `releases/share-packages/desktop/builds/`，不得覆盖历史包。
- 桌面稳定版：仅从 `releases/stable-desktop/` 选取已验证的交付物。
- 手机版：任何声明“已交付”的 `mobile/` 改动都必须完成“备份 → 独立安装包 → 日期归档 → SHA-256 核验”。具体路径见下节。

## 手机版交付与单独归档（项目强制规则）

只要本轮改动涉及 `mobile/`，且对用户交付了可用版本、下载包或线上部署，必须同时完成以下四项：

1. 在 `archives/backups/mobile-YYYYMMDD-HHMMSS/` 创建完整手机版源码备份。
2. 在 `releases/share-packages/mobile/builds/` 生成新的独立手机版安装包：`鸣潮对决-手机版-YYYYMMDD-HHMMSS.zip`；不得覆盖历史包。
3. **必须单独归档**该手机版安装包到 `releases/share-packages/mobile/archive/YYYY-MM-DD/手机版/`。此目录只存手机版交付包，不与桌面版、分享版或其他导出混放。
4. 核验 ZIP 条目数，并确认安装包与“手机版”归档副本的 SHA-256 一致。

未完成第 3 项“手机版单独归档”，即视为本轮手机版尚未交付完成。仅检查、讨论或未完成的中间修复可不打包；一旦声明“完成”“可下载”“可部署”或“已交付”，上述规则自动生效。
