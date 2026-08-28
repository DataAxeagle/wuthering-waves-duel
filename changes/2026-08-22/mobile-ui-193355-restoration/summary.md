# 手机 UI 还原到 20260821-193355

## 结果

- `mobile/styles.css` 的手机端基础布局恢复为 `鸣潮对决-手机版-上传精简版-20260821-193355.zip`。
- 保留最新版功能：教程开关、删除组牌页顶部说明、自组卡组校验与启动修复、60 张卡库、PVP、Turnstile/Cloudflare 修复。
- 保留 `html.desktop-ui` 独立电脑网页布局；该样式不会命中手机端。
- 没有覆盖 `mobile/game.js`、`mobile/core.js`、`mobile/pvp.js` 等功能实现。

## 交付

- 完整包：`releases/share-packages/mobile/builds/鸣潮对决-手机版-20260822-013830.zip`
- 精简包：`releases/share-packages/mobile/builds/鸣潮对决-手机版-上传精简版-20260822-013830.zip`
- Cloudflare Pages 部署：`e70b414f`
- 生产地址：`https://wuthering-waves-duel-mobile.pages.dev`
