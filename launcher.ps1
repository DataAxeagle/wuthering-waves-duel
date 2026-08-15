[CmdletBinding()]
param(
  [switch]$ConfigureAI,
  [switch]$ValidateOnly,
  [switch]$NoBrowser,
  [switch]$SkipAiSetup
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSCommandPath
$CredentialTarget = 'WutheringWavesDuel.DeepSeek.ApiKey'
$StateRoot = Join-Path $env:LOCALAPPDATA 'WutheringWavesDuel'
$pathBytes = [System.Text.Encoding]::UTF8.GetBytes($ProjectRoot.ToLowerInvariant())
$hashBytes = [System.Security.Cryptography.SHA256]::Create().ComputeHash($pathBytes)
$PackageId = ([System.BitConverter]::ToString($hashBytes).Replace('-', '')).Substring(0, 16)
$StateDirectory = Join-Path $StateRoot $PackageId
$StatePath = Join-Path $StateDirectory 'launcher-state.json'

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public static class WutheringWavesDuelCredential {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct CREDENTIAL {
    public UInt32 Flags;
    public UInt32 Type;
    public string TargetName;
    public string Comment;
    public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
    public UInt32 CredentialBlobSize;
    public IntPtr CredentialBlob;
    public UInt32 Persist;
    public UInt32 AttributeCount;
    public IntPtr Attributes;
    public string TargetAlias;
    public string UserName;
  }

  [DllImport("advapi32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
  private static extern bool CredRead(string target, UInt32 type, UInt32 flags, out IntPtr credentialPtr);
  [DllImport("advapi32.dll", SetLastError = true)]
  private static extern bool CredWrite(ref CREDENTIAL credential, UInt32 flags);
  [DllImport("advapi32.dll", SetLastError = true)]
  private static extern bool CredDelete(string target, UInt32 type, UInt32 flags);
  [DllImport("advapi32.dll")]
  private static extern void CredFree(IntPtr buffer);

  private const UInt32 GenericCredential = 1;
  private const UInt32 LocalMachinePersist = 2;

  public static string Read(string target) {
    IntPtr ptr;
    if (!CredRead(target, GenericCredential, 0, out ptr)) return null;
    try {
      CREDENTIAL credential = (CREDENTIAL)Marshal.PtrToStructure(ptr, typeof(CREDENTIAL));
      if (credential.CredentialBlob == IntPtr.Zero || credential.CredentialBlobSize == 0) return "";
      return Marshal.PtrToStringUni(credential.CredentialBlob, (int)credential.CredentialBlobSize / 2);
    } finally { CredFree(ptr); }
  }

  public static bool Write(string target, string secret) {
    byte[] bytes = Encoding.Unicode.GetBytes(secret ?? "");
    IntPtr blob = Marshal.AllocCoTaskMem(bytes.Length);
    try {
      Marshal.Copy(bytes, 0, blob, bytes.Length);
      CREDENTIAL credential = new CREDENTIAL();
      credential.Type = GenericCredential;
      credential.TargetName = target;
      credential.CredentialBlobSize = (UInt32)bytes.Length;
      credential.CredentialBlob = blob;
      credential.Persist = LocalMachinePersist;
      credential.UserName = "WutheringWavesDuel";
      return CredWrite(ref credential, 0);
    } finally { Marshal.FreeCoTaskMem(blob); }
  }

  public static void Delete(string target) { CredDelete(target, GenericCredential, 0); }
}
"@

function Read-LauncherState {
  if (-not (Test-Path -LiteralPath $StatePath)) { return [pscustomobject]@{ skippedApiPrompt = $false } }
  try { return (Get-Content -LiteralPath $StatePath -Raw -Encoding UTF8 | ConvertFrom-Json) }
  catch { return [pscustomobject]@{ skippedApiPrompt = $false } }
}

function Save-LauncherState([bool]$SkippedApiPrompt) {
  New-Item -ItemType Directory -Path $StateDirectory -Force | Out-Null
  $state = [pscustomobject]@{ skippedApiPrompt = $SkippedApiPrompt; updatedAt = (Get-Date).ToString('s') }
  [System.IO.File]::WriteAllText($StatePath, ($state | ConvertTo-Json), [System.Text.UTF8Encoding]::new($false))
}

function Show-AiSetupDialog {
  Add-Type -AssemblyName System.Windows.Forms
  Add-Type -AssemblyName System.Drawing
  $form = New-Object System.Windows.Forms.Form
  $form.Text = '鸣潮：对决 - AI 设置'
  $form.Size = New-Object System.Drawing.Size(500, 255)
  $form.StartPosition = 'CenterScreen'
  $form.FormBorderStyle = 'FixedDialog'
  $form.MaximizeBox = $false
  $form.MinimizeBox = $false
  $form.Font = New-Object System.Drawing.Font('Microsoft YaHei UI', 9)

  $title = New-Object System.Windows.Forms.Label
  $title.Text = 'Wuthering Waves: Duel'
  $title.Font = New-Object System.Drawing.Font('Microsoft YaHei UI', 16, [System.Drawing.FontStyle]::Bold)
  $title.AutoSize = $true
  $title.Location = New-Object System.Drawing.Point(25, 18)
  $form.Controls.Add($title)

  $description = New-Object System.Windows.Forms.Label
  $description.Text = "可选：填写 DeepSeek API Key 后使用 AI 对手。
留空并选择本地 AI，则使用内置规则逻辑。"
  $description.AutoSize = $true
  $description.Location = New-Object System.Drawing.Point(28, 58)
  $form.Controls.Add($description)

  $keyBox = New-Object System.Windows.Forms.TextBox
  $keyBox.Location = New-Object System.Drawing.Point(28, 112)
  $keyBox.Size = New-Object System.Drawing.Size(428, 28)
  $keyBox.UseSystemPasswordChar = $true
  $form.Controls.Add($keyBox)

  $cloud = New-Object System.Windows.Forms.Button
  $cloud.Text = '保存并启动 DeepSeek AI'
  $cloud.Size = New-Object System.Drawing.Size(185, 36)
  $cloud.Location = New-Object System.Drawing.Point(271, 164)
  $cloud.DialogResult = [System.Windows.Forms.DialogResult]::OK
  $form.Controls.Add($cloud)

  $local = New-Object System.Windows.Forms.Button
  $local.Text = '跳过，使用本地 AI'
  $local.Size = New-Object System.Drawing.Size(185, 36)
  $local.Location = New-Object System.Drawing.Point(70, 164)
  $local.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
  $form.Controls.Add($local)

  $form.AcceptButton = $cloud
  $form.CancelButton = $local
  $result = $form.ShowDialog()
  if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
    $key = $keyBox.Text.Trim()
    if ([string]::IsNullOrWhiteSpace($key)) {
      [System.Windows.Forms.MessageBox]::Show('请输入 API Key，或选择“跳过，使用本地 AI”。', '鸣潮：对决') | Out-Null
      return Show-AiSetupDialog
    }
    return [pscustomobject]@{ apiKey = $key; localOnly = $false }
  }
  return [pscustomobject]@{ apiKey = ''; localOnly = $true }
}

function Get-NodeExecutable {
  $portable = Join-Path $ProjectRoot 'runtime\node.exe'
  if (Test-Path -LiteralPath $portable) { return $portable }
  $node = Get-Command node.exe -ErrorAction SilentlyContinue
  if (-not $node) { $node = Get-Command node -ErrorAction SilentlyContinue }
  if (-not $node) { throw '未找到 Node.js。请使用分享包内含 runtime\node.exe 的版本，或安装 Node.js LTS。' }
  return $node.Source
}

if ($ValidateOnly) {
  Get-NodeExecutable | Out-Null
  if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot 'server.js'))) { throw 'server.js 缺失。' }
  Write-Output 'Launcher validation passed.'
  exit 0
}

$apiKey = [WutheringWavesDuelCredential]::Read($CredentialTarget)
$state = Read-LauncherState
if ($ConfigureAI) {
  [WutheringWavesDuelCredential]::Delete($CredentialTarget)
  Save-LauncherState $false
  $apiKey = $null
  $state = [pscustomobject]@{ skippedApiPrompt = $false }
}
if ($ConfigureAI) {
  $setup = Show-AiSetupDialog
  if ($setup.localOnly) { Save-LauncherState $true }
  else {
    if (-not [WutheringWavesDuelCredential]::Write($CredentialTarget, $setup.apiKey)) { throw '无法将 API Key 保存到 Windows 凭据管理器。' }
    Save-LauncherState $false
    $apiKey = $setup.apiKey
  }
}


function Stop-ExistingProjectServer([int]$Port) {
  $listeners = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
  foreach ($listener in $listeners) {
    $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)" -ErrorAction SilentlyContinue
    $commandLine = [string]$processInfo.CommandLine
    if ($commandLine -like "*$ProjectRoot*" -and $commandLine -match 'server\.js') {
      Stop-Process -Id $listener.OwningProcess -Force
      Start-Sleep -Milliseconds 350
    }
  }
}

function Get-AvailableGamePort {
  foreach ($candidate in 4173..4193) {
    $listeners = @(Get-NetTCPConnection -LocalPort $candidate -State Listen -ErrorAction SilentlyContinue)
    if (-not $listeners.Count) { return $candidate }
    foreach ($listener in $listeners) {
      $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)" -ErrorAction SilentlyContinue
      $commandLine = [string]$processInfo.CommandLine
      if ($commandLine -like "*$ProjectRoot*" -and $commandLine -match 'server\.js') {
        Stop-Process -Id $listener.OwningProcess -Force
        Start-Sleep -Milliseconds 350
        return $candidate
      }
    }
  }
  throw '未找到可用的本地端口（4173–4193）。请关闭其他正在运行的本地服务后重试。'
}

$gamePort = Get-AvailableGamePort
$nodePath = Get-NodeExecutable
$startInfo = New-Object System.Diagnostics.ProcessStartInfo
$startInfo.FileName = $nodePath
$startInfo.Arguments = '"' + (Join-Path $ProjectRoot 'server.js') + '"'
$startInfo.WorkingDirectory = $ProjectRoot
$startInfo.UseShellExecute = $false
$startInfo.CreateNoWindow = $true
$startInfo.EnvironmentVariables['GAME_PORT'] = [string]$gamePort
if (-not [string]::IsNullOrWhiteSpace($apiKey)) { $startInfo.EnvironmentVariables['DEEPSEEK_API_KEY'] = $apiKey } else { $startInfo.EnvironmentVariables.Remove('DEEPSEEK_API_KEY') }
[System.Diagnostics.Process]::Start($startInfo) | Out-Null
Start-Sleep -Milliseconds 900
try {
  $health = Invoke-WebRequest -Uri "http://127.0.0.1:$gamePort/api/status" -UseBasicParsing -TimeoutSec 4
  if ($health.StatusCode -ne 200) { throw "本地服务返回状态 $($health.StatusCode)。" }
} catch {
  throw "鸣潮：对决未能启动本地服务。$($_.Exception.Message)"
}
if ($NoBrowser) { Write-Output "Waves Duel local server started on port $gamePort." }
else { Start-Process "http://127.0.0.1:$gamePort" }
