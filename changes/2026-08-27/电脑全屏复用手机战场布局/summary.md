# 电脑全屏复用手机战场布局

## 结果

- 电脑端战场改为与手机横屏相同的信息架构，只扩展为全屏尺寸。
- 双方状态固定左上/左下，双方三类牌堆固定右上/右下，角色居中，手牌与效果说明位于底部。
- 电脑端重复的充能、升级、换领队面板已隐藏；功能仍从手牌与角色卡点按进入。
- 手机与平板规则未修改。

## 变更文件

- `mobile/styles.css`
- `tests/check-device-ui-layout.mjs`
- `tests/mobile-core.test.cjs`
- `design-qa.md`

## 备份

- `archives/backups/mobile-desktop-mobile-layout-20260827-005143/`

## 发布包

- 完整包：`releases/share-packages/mobile/builds/鸣潮对决-手机版-20260827-012129.zip`
- 精简包：`releases/share-packages/mobile/builds/鸣潮对决-手机版-上传精简版-20260827-012129.zip`
- 两包已复制到 `releases/share-packages/mobile/archive/2026-08-27/手机版/`。
