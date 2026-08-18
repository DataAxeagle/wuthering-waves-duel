# AI 决策记录补回

## 原因

稳定桌面包仍包含 `/api/ai-decision-log` 与 Markdown 写入逻辑，但前端只在 DeepSeek 成功返回时调用它。默认本地规则 AI 不写任何记录，因此未配置 API Key 时不会生成 `AI决策记录` 文件夹。

## 修复

本地规则 AI 的三类选择现也会写入服务端：

- 回合规划（`turn_plan`）
- 对抗响应（`contest_response`）
- 追击选择（`pursuit`）

每条记录的来源为“本地规则 AI”，保留当时公开局面、合法选项和实际选择；DeepSeek 记录逻辑不变。

## 交付与验证

- 最新 `demo/game.js` 已同步进 `桌面EXE版/稳定版/鸣潮对决桌面版/app/demo/game.js`。
- 源码与包内副本 SHA-256 一致。
- JavaScript 语法检查通过；游戏与卡库回归 28/28 通过。
