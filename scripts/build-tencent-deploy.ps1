param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [string]$LitePackage,
  [string]$OutputRoot = (Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..')).Path 'output/导出/2026-08-23')
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$mobileRoot = Join-Path $ProjectRoot 'mobile'
$serverRoot = Join-Path $ProjectRoot 'tencent-server'
if (-not $LitePackage) {
  $LitePackage = Get-ChildItem -LiteralPath (Join-Path $ProjectRoot 'releases/share-packages/mobile/builds') -File |
    Where-Object Name -Like '鸣潮对决-手机版-上传精简版-*.zip' |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1 -ExpandProperty FullName
}
$LitePackage = (Resolve-Path -LiteralPath $LitePackage).Path
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$stage = Join-Path $OutputRoot "tencent-deploy-$stamp"
$mobileStage = Join-Path $stage 'mobile'
$serverStage = Join-Path $stage 'tencent-server'
$sharedStage = Join-Path $stage 'supabase/functions/_shared'
$zipPath = Join-Path $OutputRoot "鸣潮对决-腾讯云部署包-$stamp.zip"
$tarPath = Join-Path $OutputRoot "鸣潮对决-腾讯云部署包-$stamp.tar.gz"

New-Item -ItemType Directory -Path $OutputRoot -Force | Out-Null
New-Item -ItemType Directory -Path $mobileStage -Force | Out-Null
Expand-Archive -LiteralPath $LitePackage -DestinationPath $mobileStage

# 精简包确定运行时文件集合；同名文件以当前源码覆盖，并补入腾讯云客户端兼容层。
Get-ChildItem -LiteralPath $mobileStage -Recurse -File | ForEach-Object {
  $relative = [IO.Path]::GetRelativePath($mobileStage, $_.FullName)
  $current = Join-Path $mobileRoot $relative
  if (Test-Path -LiteralPath $current -PathType Leaf) { Copy-Item -LiteralPath $current -Destination $_.FullName -Force }
}
Copy-Item -LiteralPath (Join-Path $mobileRoot 'pvp-client-shim.js') -Destination (Join-Path $mobileStage 'pvp-client-shim.js') -Force

New-Item -ItemType Directory -Path $serverStage -Force | Out-Null
Get-ChildItem -LiteralPath $serverRoot -Recurse -File |
  Where-Object { $_.FullName -notmatch '[\\/](node_modules|data)[\\/]' -and $_.Name -ne '.env' } |
  ForEach-Object {
    $relative = [IO.Path]::GetRelativePath($serverRoot, $_.FullName)
    $destination = Join-Path $serverStage $relative
    New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
    Copy-Item -LiteralPath $_.FullName -Destination $destination -Force
  }

New-Item -ItemType Directory -Path $sharedStage -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $ProjectRoot 'supabase/functions/_shared/pvp-state.mjs') -Destination (Join-Path $sharedStage 'pvp-state.mjs') -Force

Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $zipPath -CompressionLevel Optimal
& tar.exe -czf $tarPath -C $stage '.'
if ($LASTEXITCODE -ne 0) { throw "tar archive failed with exit code $LASTEXITCODE" }
$files = Get-ChildItem -LiteralPath $stage -Recurse -File
$zipHash = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash
$tarHash = (Get-FileHash -LiteralPath $tarPath -Algorithm SHA256).Hash
[PSCustomObject]@{
  Stage = $stage
  Zip = $zipPath
  Tar = $tarPath
  Files = @($files).Count
  Bytes = ($files | Measure-Object Length -Sum).Sum
  ZipBytes = (Get-Item -LiteralPath $zipPath).Length
  TarBytes = (Get-Item -LiteralPath $tarPath).Length
  SHA256 = $zipHash
  TarSHA256 = $tarHash
  SourceLitePackage = $LitePackage
}
