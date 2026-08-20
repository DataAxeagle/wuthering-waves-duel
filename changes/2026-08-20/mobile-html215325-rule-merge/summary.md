# 手机版合并 HTML215325 规则与 60 张卡库

## 结论

- 以 `鸣潮对决-手机版-20260820-180437` 为外壳和联机基础完成本地合并。
- 卡库由 52 张扩展到 60 张：26 张角色牌、34 张行动牌；新增 8 张角色牌均保留 PNG，并生成手机版 WebP。
- 移植角色登场、升级、回合开始、回合结束与判定触发的延迟结算，弃牌区选牌由权威状态校验并可断线恢复。
- 女漂泊者 Lv.2 按“角色提示 → 额外抽 1 → 常规抽 2”顺序结算。
- 联机端新增 `resolve_deferred_effect` 命令、规则版本拒绝、待选隐私投影与事件脱敏。
- 联机双方现在都会播放对抗、升级与角色触发过程；服务器已落地的伤害仅播放动画，不在客户端重复扣除。
- 未替换 `mobile/index.html`，未改现有手机分辨率档位和布局媒体查询；弃牌区选牌只复用已有 `responseOverlay` 并增加小屏安全样式。
- 本次未打包、未部署、未修改数据库 schema、环境变量或密钥。

## 备份

- `archives/backups/mobile-20260820-220750-pre-html215325-rule-merge/mobile-source`
- `archives/backups/mobile-20260820-220750-pre-html215325-rule-merge/release-package/鸣潮对决-手机版-20260820-180437.zip`
- 原包 SHA-256：`3B8223A48A697A9F245FCBBF00911C094A7B7AF917C9C90F8C145A9F80F4FCE2`

## 主要变更文件

- `mobile/core.js`
- `mobile/game.js`
- `mobile/styles.css`
- `mobile/pvp-game.js`
- `mobile/card-library/catalog.js`
- `mobile/card-library/catalog.json`
- `mobile/card-library/art/角色牌/BP01-{002,003,004,005,023,026,029,032}.{png,webp}`
- `supabase/functions/pvp/index.ts`
- `supabase/functions/_shared/pvp-state.mjs`
- `tests/card-library.test.cjs`
- `tests/mobile-core.test.cjs`
- `tests/pvp.test.cjs`
- `tests/check-turn-character-pursuit-ui.mjs`
- `tests/check-screen-profile-layout.mjs`
- `tests/check-responsive-layout.mjs`

## 验证结果

- Node 规则、卡库、手机版与 PVP 测试：67/67 通过。
- `mobile/game.js` JavaScript 语法检查：通过。
- Supabase Edge Function Deno 类型检查：通过。
- 手机横屏档位：736×414、852×393、915×412 均无面板、选项和战场裁切。
- PVP 房间页：844×390、667×375 均无横向溢出或操作区裁切。
- 弃牌区角色效果选牌：844×390、667×375 均在视口内，按钮和卡牌选择区可见。

## 未验证边界

- 因用户要求先不上传新包，本次没有部署新版 Supabase Function 和 Cloudflare 前端，也没有进行线上两台设备真实联调。
- 本地类型、规则、隐私投影和浏览器布局均已验证，但线上延迟与真实 Realtime 时序需部署后再验。
