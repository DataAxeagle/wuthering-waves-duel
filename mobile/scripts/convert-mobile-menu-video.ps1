param(
  [string]$InputPath = "",
  [string]$OutputPath = "demo/assets/menu/menu-mobile.mp4",
  [string]$FfmpegPath = ""
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$ffmpeg = if ($FfmpegPath) { Get-Item -LiteralPath $FfmpegPath -ErrorAction SilentlyContinue } else { Get-Command ffmpeg.exe -ErrorAction SilentlyContinue }
if (-not $ffmpeg) { $ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue }
if (-not $ffmpeg) {
  throw "ffmpeg was not found. Install it and run scripts/convert-mobile-menu-video.ps1 again."
}
if (-not $InputPath) {
  $candidate = Get-ChildItem -LiteralPath "demo/assets/menu" -File -Filter "*.mp4" | Where-Object { $_.Name -ne "menu-mobile.mp4" } | Select-Object -First 1
  $inputAssets = Join-Path $projectRoot "assets\input"
  if (-not $candidate -and (Test-Path -LiteralPath $inputAssets)) {
    $candidate = Get-ChildItem -LiteralPath $inputAssets -File -Filter "*.mp4" | Select-Object -First 1
  }
  $InputPath = $candidate.FullName
}
if (-not (Test-Path -LiteralPath $InputPath)) { throw "找不到输入视频：$InputPath" }

$outputDirectory = Split-Path -Parent $OutputPath
if (-not (Test-Path -LiteralPath $outputDirectory)) { throw "Output directory does not exist: $outputDirectory" }

$ffmpegExecutable = if ($ffmpeg -is [System.IO.FileInfo]) { $ffmpeg.FullName } else { $ffmpeg.Source }
& $ffmpegExecutable -y -i $InputPath `
  -vf "scale=854:480,fps=24" `
  -c:v libx264 -preset medium -crf 33 -maxrate 480k -bufsize 960k -pix_fmt yuv420p `
  -c:a aac -b:a 56k -movflags +faststart $OutputPath

if ($LASTEXITCODE -ne 0) { throw "ffmpeg failed with exit code: $LASTEXITCODE" }
$sizeMiB = [math]::Round((Get-Item -LiteralPath $OutputPath).Length / 1MB, 2)
if ($sizeMiB -ge 25) {
  throw "Mobile video is $sizeMiB MiB, above the Cloudflare Pages 25 MiB limit. The output was retained for review."
}

Write-Output "Mobile video created: $OutputPath ($sizeMiB MiB)"
