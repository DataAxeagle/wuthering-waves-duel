# 手机版自组牌组卡牌区空间修复

## 修改

- 删除自组牌组页顶部整段构筑说明：`逐张拖拽右侧卡牌到左侧组牌区……`。
- 不修改卡牌规则、卡牌尺寸、拖拽逻辑、筛选器、保存按钮或其他页面。
- 释放的垂直高度直接交给左右组牌区域，使 844 × 390 横屏下右侧卡牌库能显示更多完整卡牌行。

## 备份与交付

- 修改前备份：`archives/backups/mobile-20260821-235307-pre-deck-builder-space-fix/`，手机版 264 个文件逐文件哈希差异 0；旧 `design-qa.md` 同步保留为 `design-qa.previous.md`。
- 完整包：`releases/share-packages/mobile/builds/鸣潮对决-手机版-20260821-235558.zip`。
- 上传精简包：`releases/share-packages/mobile/builds/鸣潮对决-手机版-上传精简版-20260821-235558.zip`。
- 两个包均已复制到 `releases/share-packages/mobile/archive/2026-08-21/手机版/`。

## 验证

- 21 个手机功能页状态和 3 个电脑视口无外框裁切或水平溢出。
- 规则、PVP、卡库测试 33/33 通过。
- 两个 ZIP 包内 `index.html` 均确认不再包含被删除说明，且均包含 PVP 必需的 `pvp-game.js`。
- 视觉 QA：项目根目录 `design-qa.md`，最终结果 `passed`。
