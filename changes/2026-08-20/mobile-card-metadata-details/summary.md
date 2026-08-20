# 手机版卡牌完整属性文字补齐

## 完成内容

- 角色牌详情统一展示：武器、共鸣属性、地区。
- 行动牌详情统一展示：行动类别、子类别、共鸣属性、绑定角色。
- 已覆盖卡牌图鉴、自组牌组预览与卡牌列表、角色牌库、弃牌区、场上右侧详情、开局选牌预览、卡牌竞技场、战斗日志悬浮详情、对抗翻牌、战斗胜利展示、弃牌选择、升级弃牌详情与角色效果弹窗。
- 所有运行时卡牌优先从 60 张卡库查回完整元数据，避免战斗快照中的简化对象漏字段。
- 未修改卡面素材、游戏规则、手机分辨率档位、布局媒体查询、线上部署或数据库。

## 备份

- `archives/backups/mobile-20260820-224807-pre-card-text-metadata/mobile-source`
- 源与备份文件数：264 / 264。

## 验证

- Node 全量规则、卡库、手机版与 PVP 测试：68/68 通过。
- `node --check mobile/game.js`：通过。
- CDP 横屏检查：角色与行动牌属性文本均存在，844×390 无裁切、无横向溢出。
- 原三档手机适配、PVP 房间页与先后手提示回归均通过。

## 发布

- Supabase Edge Function：已部署 `pvp` 到 `pgxfrxrrcumavalbwqse`。
- Cloudflare Pages：已部署生产分支，预览版本 `https://f5cd8fea.wuthering-waves-duel-mobile.pages.dev`，正式地址为 `https://wuthering-waves-duel-mobile.pages.dev`。
- 正式站首页、PVP 大厅和两张回合提示素材均返回 HTTP 200；未登录 PVP API 按预期返回 HTTP 401。
- 安装包：`releases/share-packages/mobile/builds/鸣潮对决-手机版-20260820-230143.zip`。
- 日期归档：`releases/share-packages/mobile/archive/2026-08-20/手机版/鸣潮对决-手机版-20260820-230143.zip`。
- 两份 ZIP：268 个条目，SHA-256 均为 `317C07B244D72D9BD76CBCA5DF88EABA12D400B8FBC6C319E23DC8656D263ADF`。

## 变更文件

- `mobile/game.js`
- `tests/mobile-core.test.cjs`
- `tests/check-turn-character-pursuit-ui.mjs`
