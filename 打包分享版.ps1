[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSCommandPath
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$packageName = "鸣潮对决-分享版-$stamp"
$outputRoot = Join-Path $ProjectRoot 'output'
$packagePath = Join-Path $outputRoot $packageName
$zipPath = Join-Path $outputRoot ($packageName + '.zip')
$node = (Get-Command node.exe -ErrorAction Stop).Source

New-Item -ItemType Directory -Path $packagePath -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $ProjectRoot 'demo') -Destination (Join-Path $packagePath 'demo') -Recurse
foreach ($file in @('server.js', 'launcher.ps1', '启动游戏.vbs', '配置 AI.vbs', '启动游戏.cmd', 'README.md', 'LICENSE')) {
  Copy-Item -LiteralPath (Join-Path $ProjectRoot $file) -Destination (Join-Path $packagePath $file)
}
New-Item -ItemType Directory -Path (Join-Path $packagePath 'runtime') -Force | Out-Null
Copy-Item -LiteralPath $node -Destination (Join-Path $packagePath 'runtime\node.exe')
$guide = @"
鸣潮：对决 / Wuthering Waves: Duel

1. 双击“启动游戏.vbs”。首次会弹出 AI 设置：填写 DeepSeek API Key，或选择本地 AI。
2. API Key 只会保存在当前 Windows 用户的凭据管理器，不会写入此分享包。
3. 若要更换或移除 API Key，双击“配置 AI.vbs”。
4. 浏览器会自动打开 http://127.0.0.1:4173 。关闭浏览器不会停止本地服务；再次双击启动器会重启本游戏服务。

本包为非商业同人本地原型，请勿作为官方产品或用于未经授权的商业分发。
"@
[System.IO.File]::WriteAllText((Join-Path $packagePath '分享说明.txt'),$guide,[System.Text.UTF8Encoding]::new($true))
Compress-Archive -LiteralPath $packagePath -DestinationPath $zipPath
Write-Output $zipPath
