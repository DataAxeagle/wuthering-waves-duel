# 执行与验证

## 安全边界

- 修改前备份：`archives/backups/mobile-20260822-013037-pre-193355-ui-restoration`
- 参考包只读提取：`output/测试/2026-08-22/mobile-ui-reference-193355`
- 参考 ZIP SHA-256：`40EC91655520752248E4591AC549C4D0CE4F906EA33836F880614CED6A8FB719`
- 旧参考包没有 `pvp-game.js`，因此没有整包覆盖最新版运行时代码。

## UI 合并

- 当前 `mobile/styles.css` 以前缀方式完整包含 193355 的 CSS 基线。
- 基线后只追加教程开关和 `html.desktop-ui` 规则。
- 已确认不存在被否决的手机安全区压缩覆盖，也没有全局隐藏声音按钮的规则。
- 7 个功能页已生成旧版/还原版左右对照图：`output/测试/2026-08-22/ui-comparison-193355-restored/`。

## 自动验证

- `node --check mobile/game.js`：通过。
- `node --check mobile/pvp.js`：通过。
- `node --test tests/mobile-core.test.cjs tests/pvp.test.cjs tests/card-library.test.cjs`：33/33 通过。
- `node tests/check-pvp-auth-persistence.mjs`：通过。
- `node tests/check-responsive-layout.mjs`：桌面 7 档、PVP 手机横屏 2 档、先后手提示 1 档均通过。
- 设备 UI 浏览器检查：手机 21 个页面状态、桌面 3 个视口通过。

## 打包与上线

- 完整包 264 个文件，精简包 81 个文件；两个 ZIP 均逐条读取成功。
- build 与 archive 副本 SHA-256 一致：
  - 完整包：`56AC5EE69B2132879FB346ABD7E06C7E6AD0EDFE66C0B9407548429D7346FFFE`
  - 精简包：`E3AD47BF2A76D95A9DFA91CEB6306EF7C4219895EB60F79373BBD46B7FC264F7`
- Cloudflare 线上静态资源与精简包 80/80 哈希一致。
- `/api/status` 返回 HTTP 200、`available: true`。
- 线上 Turnstile 与 challenge 资源均返回 200，无页面异常和失败请求；无会话时按钮按设计锁定并提示完成验证。
