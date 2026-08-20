# 执行记录

1. 备份当前已合并规则的 `mobile/`，避免覆盖前一阶段的 60 张卡库和 PVP 改动。
2. 对照桌面 HTML215325 的属性字段输出，确认手机版卡库已有字段，但详情渲染没有复用它们。
3. 在手机版添加运行时卡牌到卡库原始记录的回查，以及角色/行动牌两类补充属性文本。
4. 将该文本接入图鉴、自组、测试场、开局、角色牌库/弃牌区、场上选择、日志、翻牌、胜利和角色效果动画。
5. 为源码和 844×390 横屏可视化新增回归断言。

## 验证命令

```powershell
node --check mobile/game.js
node --test tests/game.test.cjs tests/card-library.test.cjs tests/mobile-core.test.cjs tests/pvp.test.cjs
node tests/check-turn-character-pursuit-ui.mjs
node tests/check-screen-profile-layout.mjs
node tests/check-responsive-layout.mjs
```

## 结果

- 68 项 Node 测试全部通过。
- CDP 验证中角色属性、行动属性均无裁切；三档适配和 PVP 房间布局保持通过。

## 发布执行

```powershell
npx -y supabase@latest functions deploy pvp --project-ref pgxfrxrrcumavalbwqse
npx wrangler pages deploy mobile --project-name wuthering-waves-duel-mobile --branch main
```

- Supabase CLI 上传了 `pvp/index.ts`、脱敏投影、共享规则核心和 60 张卡库。
- Cloudflare Pages 完成 263 项资源上传，生产预览标识为 `f5cd8fea`。
- 正式站脚本确认包含 `cardSupplementalAttributeText`、`行动类别：` 和 `resolve_deferred_effect`；公开 `pvp-config.js` 不含 `service_role`。
