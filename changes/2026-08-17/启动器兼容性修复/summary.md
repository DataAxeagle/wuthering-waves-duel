# 启动器兼容性修复

## 根因

- VBS 在部分 Windows 环境被限制或拒绝执行；实际复现为 `CScript` 的 Access is denied。
- Windows PowerShell 5.1 中 `ProcessStartInfo.EnvironmentVariables` 可能为 null，旧启动器写入 `GAME_PORT` 时崩溃，返回无意义错误码 `-196608`。
- `.cmd` 不能可靠按 UTF-8 读取中文目录/提示文本，曾导致命令行被拆坏。

## 修复

- 分享包入口改为 `启动游戏.cmd` 与 `配置AI.cmd`，不再分发 VBS 启动入口。
- 批处理入口和内部运行目录使用 ASCII（`app/`），跨系统代码页稳定。
- 启动器使用临时进程环境 + `Start-Process` 启动 Node，兼容 Windows PowerShell 5.1 与 PowerShell 7。
- 启动失败时窗口保留真实错误，不再只显示不可诊断错误码；启动器额外写入 `app/launcher-diagnostic.log` 便于反馈。

## 验证

- `node --test tests/game.test.cjs tests/card-library.test.cjs`：21/21 通过。
- 源码根目录 `启动游戏.cmd` 在 Windows PowerShell 5.1 链路返回 0。
- 新分享包的 `启动游戏.cmd` 返回 0，`app/launcher.ps1 -ValidateOnly` 返回 0。
- 新包根目录仅含 `启动游戏.cmd`、`配置AI.cmd`、`分享说明.txt` 与 `app/`。
