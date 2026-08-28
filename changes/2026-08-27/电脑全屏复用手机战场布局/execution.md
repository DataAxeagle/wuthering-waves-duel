# 执行与验证

## 实现边界

- 仅新增 `html.desktop-ui` 作用域下的电脑端布局覆盖。
- 未修改游戏规则、卡牌数据、PVP 状态机、手机横屏选择器或平板断点。
- 未部署线上版本。

## 视觉验证

- 1745 × 839：与用户附件2同视口并排比较，关键区域位置一致。
- 1366 × 768：无状态区、角色卡、牌堆、操作栏和手牌互相遮挡。
- 1024 × 768：触发窄电脑收束规则，无页面横向溢出，效果说明保持独立滚动。
- 手机预览：原 844 × 390 外壳与首页布局未受 `desktop-ui` 覆盖影响。

证据：

- `output/测试/2026-08-27/desktop-mobile-layout/desktop-1745x839.png`
- `output/测试/2026-08-27/desktop-mobile-layout/comparison-reference-implementation.png`

## 自动验证

- `node --check mobile/game.js`：通过。
- 核心测试：87/87 通过。
- 新增桌面布局静态回归后，`node --test tests/mobile-core.test.cjs`：25/25 通过。

## 包与归档核验

| 包 | 条目数 | 卡牌 PNG | SHA-256 |
| --- | ---: | ---: | --- |
| 完整包 | 269 | 60 | `94687A5D6A4552FBBBFA0DDF0A7C2D6150FE7871007347689101547B00746CA9` |
| 精简包 | 83 | 0 | `EF8F43620523458A701492740DCC48C1482111D0E2F0D44524A90FD4BA1FC95E` |

- 两包所有 ZIP 条目均可完整读取。
- 两包中的 `index.html`、`game.js`、`styles.css`、`pvp.html` 与当前 `mobile/` 源码哈希一致。
- 构建目录与归档目录中的两份 ZIP 哈希一致。
- 本轮未部署 Cloudflare 或腾讯云。
