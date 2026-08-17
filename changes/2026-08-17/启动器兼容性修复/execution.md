# 执行记录

1. 通过 VBS、CMD、Windows PowerShell 5.1 三条路径复现启动问题。
2. 捕获到 Windows PowerShell 5.1 的具体失败行：`ProcessStartInfo.EnvironmentVariables['GAME_PORT']`。
3. 改为 `Start-Process` 继承短生命周期的环境变量。
4. 移除分享包的 VBS 入口，改为仅 ASCII 的 CMD 入口和 `app/` 内部目录。
5. 重新打包并进行包内 CMD 实测与启动器自检。
