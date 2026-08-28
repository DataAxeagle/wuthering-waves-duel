# 手机图鉴与战斗详情滚动修复

- 保持图鉴弹窗和战场整体尺寸不变。
- 图鉴卡面按手机 Safari 实际可视高度完整缩放。
- 图鉴右侧详情改为内部纵向滚动，并取消效果文字截断。
- 战斗右下说明上移 10px，超长卡牌文字改为区域内纵向滚动。
- 只修改手机横屏与桌面手机预览选择器，不影响 `html.desktop-ui`。

## 交付与部署

- 完整包：`releases/share-packages/mobile/builds/鸣潮对决-手机版-20260822-020620.zip`
- 精简包：`releases/share-packages/mobile/builds/鸣潮对决-手机版-上传精简版-20260822-020620.zip`
- Cloudflare Pages 部署：`bec16561`
- 生产地址：`https://wuthering-waves-duel-mobile.pages.dev`
