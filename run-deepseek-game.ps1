param(
  [int]$Port = 4173
)

if (-not $env:DEEPSEEK_API_KEY) {
  Write-Host "DEEPSEEK_API_KEY is not set. The game will use local fallback AI." -ForegroundColor Yellow
}

$env:GAME_PORT = [string]$Port
node (Join-Path $PSScriptRoot "server.js")
