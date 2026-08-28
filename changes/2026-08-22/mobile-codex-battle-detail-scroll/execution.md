# 执行与验证

- 修改前备份：`archives/backups/mobile-ui-scroll-20260822-015105`
- 修改文件：`mobile/styles.css`
- 新增回归：`tests/check-mobile-scroll-areas.mjs`
- 视觉证据：`output/测试/2026-08-22/mobile-scroll-areas/`

验证结果：

- 844 × 340：图鉴卡面完整、详情可滚动、右下长文字可滚动，控制台 0 异常。
- 844 × 390：同上。
- 21 个手机功能页状态、3 个桌面视口无页面裁切或水平溢出。
- 桌面响应式 7 档、PVP 手机横屏 2 档、先后手提示 1 档通过。
- 规则、卡库、自组卡组、PVP、Turnstile 测试 33/33 通过。

## 打包与线上验证

- 完整包 264 个文件，精简包 81 个文件，均可逐条读取。
- 两个包的 `styles.css` 与当前源码 SHA-256 一致：`84B8A681173EEB58ED7527CD5DAF40333ADEF00D405850B0012E3A413FC2A5F0`。
- 两个包均包含图鉴修复、右下说明滚动修复和 `pvp-game.js`。
- 完整包 SHA-256：`D25AE26B1E888E6F287FF6C47FCFF611520267C981537647C80D5BA4EC6F95E7`。
- 精简包 SHA-256：`18B1B5CC2D1F27C1D4230B60F3ED96CDCE0A90BD2C3ECC7B613B560EF0DD7021`。
- Cloudflare 线上静态资源与精简包 80/80 哈希一致。
- 线上 844 × 340 浏览器回归通过，图鉴和右下说明均可滚动，无控制台异常。
- `/api/status` 返回 HTTP 200、`available: true`。
