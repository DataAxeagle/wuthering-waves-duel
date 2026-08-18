[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSCommandPath
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$packageName = "鸣潮对决-分享版-$stamp"
$outputRoot = Join-Path $ProjectRoot 'output'
$packagePath = Join-Path $outputRoot $packageName
$zipPath = Join-Path $outputRoot ($packageName + '.zip')
$gameFilesPath = Join-Path $packagePath 'app'
$node = (Get-Command node.exe -ErrorAction Stop).Source

New-Item -ItemType Directory -Path $packagePath -Force | Out-Null
New-Item -ItemType Directory -Path $gameFilesPath -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $packagePath 'AI决策记录') -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $ProjectRoot 'demo') -Destination (Join-Path $gameFilesPath 'demo') -Recurse
foreach ($file in @('server.js', 'launcher.ps1')) {
  Copy-Item -LiteralPath (Join-Path $ProjectRoot $file) -Destination (Join-Path $gameFilesPath $file)
}
New-Item -ItemType Directory -Path (Join-Path $gameFilesPath 'runtime') -Force | Out-Null
Copy-Item -LiteralPath $node -Destination (Join-Path $gameFilesPath 'runtime\node.exe')
foreach ($file in @('启动游戏.cmd', '配置AI.cmd', 'LICENSE')) {
  Copy-Item -LiteralPath (Join-Path $ProjectRoot $file) -Destination (Join-Path $packagePath $file)
}
$guide = @"
鸣潮：对决 / Wuthering Waves: Duel

1. 双击“启动游戏.cmd”启动游戏。无需配置 API 也可游玩，此时使用本地规则 AI。
2. 想使用 DeepSeek AI：先双击“配置AI.cmd”，再双击“启动游戏.cmd”。玩家名称、战绩、局内存档和自组卡组保存在当前 Windows 用户数据目录，更新或直接覆盖分享包不会影响；API Key 单独保存在 Windows 凭据管理器。
3. 联网模式下，每一局 DeepSeek 决策会单独写入根目录的“AI决策记录”文件夹；该文件夹不属于游戏程序文件，更新时请保留。
4. 游戏优先使用 http://127.0.0.1:4173；若旧版本服务尚未退出，会自动改用 4174–4193 的可用地址。CMD 会打印本次实际游戏地址；浏览器没有自动打开时，请复制 CMD 中显示的地址，而不要固定输入 4173。API、玩家名称、战绩、局内存档和自组卡组由 Windows 用户资料库同步，不受端口变化影响。
5. 在游戏内选择“退出游戏”或关闭最后一个游戏浏览器标签页后，本地服务会自动关闭；再次打开需重新双击“启动游戏.cmd”。
6. “app”目录是内部运行文件，请勿移动、改名或单独运行其中的文件。
7. 若不同屏幕尺寸或浏览器缩放导致少数界面组件看起来拥挤，可按住 Ctrl 并滚动鼠标滚轮，调整浏览器整体缩放比例，直到布局适合当前屏幕；建议优先使用 80% 至 125%。

更新 / 覆盖安装说明

1. 先在游戏内选择“退出游戏”，或关闭最后一个游戏浏览器标签页，等待旧版本地服务停止。
2. 完整解压新版 ZIP。可将新版根目录中的“app”、启动脚本、配置脚本和 LICENSE 覆盖到旧版同名位置；也可以保留旧文件夹，直接使用新文件夹运行。
3. 不要删除根目录的“AI决策记录”文件夹。覆盖时如提示同名文件，保留其中已有 Markdown 决策记录；新版只会新增/更新该文件夹内的“使用说明.md”。
4. API Key、玩家名称、战绩、局内存档和自组卡组不在分享包文件夹内，均保存在当前 Windows 用户资料中；更新、替换或直接覆盖分享包不会清空它们。
5. 若从不支持“自组卡组跨包同步”的旧版首次升级，请先按第 1 步退出旧版，再启动新版一次并确认地址为 http://127.0.0.1:4173；新版会将旧浏览器中的自组卡组同步到 Windows 用户资料。完成一次后，后续即使端口变化也会自动恢复。
6. 请只覆盖本游戏分享包文件夹，不要覆盖或删除 Windows 用户资料目录、浏览器数据或 Windows 凭据管理器中的内容。

本包为非商业同人本地原型，请勿作为官方产品或用于未经授权的商业分发。
"@
[System.IO.File]::WriteAllText((Join-Path $packagePath '分享说明.txt'),$guide,[System.Text.UTF8Encoding]::new($true))
$decisionGuide = @"
# AI 决策记录

联网 DeepSeek AI 每完成一次有效决策，都会按对局自动写入对应的 Markdown 文件。

- 一局游戏对应一个 Markdown；同一局的规划、盖牌和追击决策会追加到同一文件。
- 仅记录公开局面、合法选项和 AI 的最终选择，不记录 API Key。
- 更新游戏时请保留此文件夹；新版压缩包不会覆盖已有对局记录。
"@
[System.IO.File]::WriteAllText((Join-Path $packagePath 'AI决策记录\使用说明.md'),$decisionGuide,[System.Text.UTF8Encoding]::new($true))
Compress-Archive -LiteralPath $packagePath -DestinationPath $zipPath
Write-Output $zipPath
