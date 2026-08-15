# 执行记录

## 代码

- `demo/core.js`：重构准备、主要、拼牌和换手状态机。
- `demo/game.js`：新增暗置角色与领队确认界面、DeepSeek 决策调用、合法动作校验和本地降级。
- `server.js`：零第三方依赖的静态服务与 `/api/ai-move` 代理。
- `run-deepseek-game.ps1`：本地服务启动入口。
- `tests/game.test.cjs`：替换旧攻击/防守断言，新增 14 项新规则测试。

## 已完成验证

- `node --check demo/core.js`：通过。
- `node --check demo/game.js`：通过。
- `node --check server.js`：通过。
- `node --test tests/game.test.cjs`：14/14 通过。
- 无 Key 服务冒烟：主页 200、`/api/status` 正确报告未配置、`/api/ai-move` 返回 503 并由前端降级。
- 浏览器完整流程：准备界面、领队确认、角色翻开、AI 充能、AI 发起拼牌、自动换手均通过；无 Key 状态正确显示“本地 AI · 未配置 Key”。
- 视觉验收截图：`mingchao-deepseek-ready-v1.png`。

## 待真实凭证验证

- 当前工作区没有读取或写入用户 API Key，因此尚未进行一次真实 DeepSeek 计费请求。
- 用户在 PowerShell 临时设置 `DEEPSEEK_API_KEY` 后即可完成真实联调。
