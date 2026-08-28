# 执行与验证

## 备份

- 修改前已备份完整 `mobile/` 到 `archives/backups/mobile-in-game-scale-shortcut-20260825-152407/`。

## 验证

- `node --check mobile/game.js`：通过。
- 手机版核心与静态缓存测试：25/25 通过。
- 浏览器布局检查：21 个手机菜单状态、iPad 横屏 112% 缩放、3 个桌面视口全部通过，均无横向溢出。
- Cloudflare 在线核验：首页、`game.js`、抽查卡牌 WebP 都返回 HTTP 200；线上首页包含 `pauseUiScaleButton`，线上脚本包含直达设置逻辑。

## 包与归档

| 包 | 条目数 | SHA-256 |
| --- | ---: | --- |
| 完整包 | 269 | `9BFB25D4EAF693E4D077C05F0BFBAEC6C26FB2BCBF3463EDE9CC1749836E4CD5` |
| 精简包 | 83 | `A7951AB625CD71B8A13B045DF8659EAB8165C4E9E6AAD00F7CFD046752A1DB5A` |

- 两个构建包均已归档至 `releases/share-packages/mobile/archive/2026-08-25/手机版/`，归档哈希匹配。
