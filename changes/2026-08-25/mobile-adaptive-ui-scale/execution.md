# 执行与验证

## 备份

- 修改前已复制完整 `mobile/` 源码到 `archives/backups/mobile-adaptive-ui-20260825-004458/`。

## 自动验证

- `node --check mobile/game.js`：通过。
- 核心、PVP、卡牌库、静态缓存与展示布局测试：84/84 通过。
- 手机档位浏览器检查：经典 16:9、全面屏 19.5:9、安卓宽屏 20:9 均无横向溢出，设置页可滚动。
- iPad 横屏模拟：识别为 `tablet`；112% 缩放已写入本地存储，页面无横向溢出。
- 响应式检查：7 个通用视口、2 个 PVP 手机横屏视口及先后手提示布局均通过。

## 包与归档核验

| 包 | 条目数 | SHA-256 |
| --- | ---: | --- |
| 完整包 | 269 | `8A86BB3BAD4E71C179BD6B24E6C37C4940FBF0DF37478FF0BB047697C41F662C` |
| 精简包 | 83 | `57603D89D7EE4387400EEA10B6F43A56C1C62ADAB7E6501B09279DEE85D475FC` |

- 两份归档副本与构建包 SHA-256 一致。
- 两份 ZIP 内的 `index.html`、`game.js`、`styles.css`、`pvp.html` 均与当前 `mobile/` 源码 SHA-256 一致。
- 本轮未部署腾讯云或 Cloudflare；线上现有版本保持不变。
