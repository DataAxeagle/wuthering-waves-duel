# 对局内画面大小入口与 Cloudflare 图片核验

## 结论

- Cloudflare Pages 部署包与线上卡牌图片资源均完整；抽查角色卡、行动卡、Logo 与卡库脚本均返回 HTTP 200。
- 用户端“图片无法加载”不是精简包漏图，仍是中国大陆网络到 Cloudflare Pages 的连通性/线路不稳定风险。

## 改动

- 对局中的“主菜单”新增“调整画面大小”。
- 点击后不丢弃当前对局，直接进入主菜单的界面大小滑动条与预设档位，并自动定位该控件；可点击“返回当前对局”回到原战场。
- 首页/PVP 资源版本更新为 `20260825-1535`，避免浏览器混用旧脚本。

## 交付

- 备份：`archives/backups/mobile-in-game-scale-shortcut-20260825-152407/`
- 完整包：`releases/share-packages/mobile/builds/鸣潮对决-手机版-20260825-152920.zip`
- 精简包：`releases/share-packages/mobile/builds/鸣潮对决-手机版-上传精简版-20260825-152920.zip`
- Cloudflare 部署：`https://2cb31a41.wuthering-waves-duel-mobile.pages.dev`
