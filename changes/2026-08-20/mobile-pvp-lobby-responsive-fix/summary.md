# 手机版 PVP 大厅横屏遮挡修复

## 结果

- 仅调整 `mobile/pvp.html` 与 `mobile/pvp.css`，不改战斗界面、单机逻辑或 PVP 服务端规则。
- PVP 创建/加入页在手机横屏下改为双栏紧凑布局：左侧显示说明、玩家名称与 Turnstile，右侧显示创建房间、房间号与加入房间。
- 面板使用 `100dvh` 限高和内部滚动兜底，避免 Safari 可用高度较小时直接裁掉验证区或按钮。
- `844×390` 与 `667×375` 两种横屏手机尺寸均通过无溢出、无重叠、无裁切检测。
- 已发布到 Cloudflare Pages 正式站 `https://wuthering-waves-duel-mobile.pages.dev`，部署版本 `94a44249`。

## 备份

- 修改前完整备份：`archives/backups/mobile-20260820-112700-pre-pvp-lobby-ui/`，共 194 个文件。
- 最终安装包：`releases/share-packages/mobile/builds/鸣潮对决-手机版-20260820-113912.zip`，共 194 个条目；手机版日期归档副本 SHA-256 一致：`0FBCBA89581D4463C7758ECE29D315F8AF38FC4C1A2F5BCF42E0E345F8F10634`。
