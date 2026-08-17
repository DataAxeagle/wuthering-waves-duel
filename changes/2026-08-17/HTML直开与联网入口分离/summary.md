# HTML 直开与联网入口分离

## 交付

- 默认入口改为 `打开游戏.html`，双击即可运行本地规则 AI，无需 Node、CMD、PowerShell 或 API Key。
- `联网AI启动.cmd` 仅用于可选 DeepSeek AI；`配置AI.cmd` 仅配置其凭据。
- 分享包根目录为 `打开游戏.html`、`联网AI启动.cmd`、`配置AI.cmd`、`分享说明.txt` 与内部 `app/`。

## 边界

- 纯 HTML 模式不能安全直接调用 DeepSeek API，因为浏览器前端会暴露 API Key。
- 因此 HTML 直开默认使用本地规则 AI；需要 DeepSeek 时才使用本地后端启动器。

## 验证

- `node --test tests/game.test.cjs tests/card-library.test.cjs`：21/21 通过。
- 新包 `打开游戏.html` 的目标 `app/demo/index.html` 存在且重定向路径正确。
- 新包 `联网AI启动.cmd` 实测返回 0。
