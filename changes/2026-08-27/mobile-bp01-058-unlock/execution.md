# 执行与验证

- 原始卡面已保存在 `assets/input/entity-card-update-2026-08-27/BP01-058-解限.png`。
- 游戏卡面：`mobile/card-library/art/绿色功能/BP01-058.png` 与 `.webp`。
- 当前附件裁切区域与已保存 PNG 逐像素一致，尺寸均为 765×1072，未重复生成或覆盖。
- `node --check mobile/core.js`：通过。
- `node --check mobile/game.js`：通过。
- 核心、单机AI、PVP、腾讯云本地后端、缓存版本测试：92/92 通过。
- 响应式浏览器检查：7种电脑视口、844×390、667×375手机横屏与开局弹窗全部通过。

## 新交付包

- 完整版：`releases/share-packages/mobile/builds/鸣潮对决-手机版-20260827-233930.zip`
  - 295 个条目；73 张卡；73 PNG + 73 WebP。
  - SHA-256：`7BA88EB9A421551B1886A906F7B8CB51ADFCB44654DE0DABA2502D6325C78B3B`
- 精简版：`releases/share-packages/mobile/builds/鸣潮对决-手机版-上传精简版-20260827-233930.zip`
  - 96 个条目；73 张卡；0 PNG + 73 WebP。
  - SHA-256：`87E359EE9DAB85C456479291B6FC70D05BC8C0872147F1D25C648673787392F8`
- 两个构建包均已复制到 `releases/share-packages/mobile/archive/2026-08-27/手机版/`，归档副本哈希一致，13张本轮新增卡面均存在。
