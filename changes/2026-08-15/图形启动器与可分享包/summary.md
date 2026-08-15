# 图形启动器与可分享包

- 新增 `启动游戏.vbs`：无控制台双击启动，首次以图形窗口选择 DeepSeek AI 或本地 AI。
- API Key 使用 Windows Credential Manager 的 `WutheringWavesDuel.DeepSeek.ApiKey` 保存；跳过选择只在 `%LOCALAPPDATA%\WutheringWavesDuel\launcher-state.json` 保存非敏感偏好。
- 新增 `配置 AI.vbs`：重新输入或移除 API Key。
- 新增 `打包分享版.ps1`：生成包含 `runtime\node.exe` 的独立 ZIP，不复制凭据、状态文件或浏览器战绩。
- 已生成分享包：`output\鸣潮对决-分享版-20260815-032802.zip`。