# 执行与验证

## 修改

- `mobile/core.js`
  - 新增 `isComboCard`。
  - 普通对抗、响应对抗过滤 `【连击】` 行动牌。
  - 追击阶段保留红色牌使用逻辑，并统一执行领队专属牌限制。
- `mobile/game.js`
  - 普通对抗候选和 AI 计划均使用规则层的合法普通对抗牌集合。
  - 非追击阶段的 `【连击】` 牌在手牌中显示为当前不可用于对抗。
- `mobile/index.html`、`mobile/pvp.html`
  - 核心资源版本参数升级为 `20260823-2325`，避免 Pages 客户端混用旧缓存。
- `rules/游戏规则.md`
  - 记录连击牌仅能追击使用，以及领队技连击牌的双条件规则。
- `tests/mobile-core.test.cjs`、`tests/pvp.test.cjs`
  - 覆盖主战、响应、追击、领队条件、AI 候选与暗置卡隐私回归。

## 本地验证

- JavaScript 语法检查：通过。
- 规则、卡库、PVP、缓存、战斗展示自动测试：83/83 通过。
- 响应式布局：7 个视口通过。
- PVP 横屏大厅：844×390、667×375 通过。
- 设备 UI：21 个手机页面状态、3 个桌面视口通过。
- 图鉴与战斗说明滚动：通过，控制台错误 0。

## 打包核验

- 完整包：269 个 ZIP 条目，SHA-256 `0D35D3C1D1C81200A30448F9A0E314FFED4269450EBFFE5C4D55B48D442F3F4D`。
- 精简包：83 个 ZIP 条目，SHA-256 `985A90D723AC931AE250DF7AC0D9B022B5DFD6AC166123BF46C8FE626C98EAFA`。
- 五个核心文件（`core.js`、`game.js`、`index.html`、`pvp.html`、`styles.css`）均与完整/精简包内条目 SHA-256 一致。
- 两个构建包与“手机版”归档副本 SHA-256 分别一致。

## Cloudflare 验收

- Wrangler 上传：81 个运行资源中上传 7 个，复用 74 个内容寻址资源；Functions 编译通过。
- 生产部署记录已确认是 `main` 分支的最新 Production 部署 `c184eb2e`。
- 稳定生产别名的 `index.html`、`pvp.html`、`core.js`、`game.js`、`/api/status` 均返回 HTTP 200。
- 线上 `core.js` 和 `game.js` SHA-256 与本地源码一致；首页已确认引用 `20260823-2325` 版本参数。
