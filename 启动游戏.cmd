@echo off
setlocal
set "GAME_ROOT=%~dp0"
set "LAUNCHER=%GAME_ROOT%app\launcher.ps1"
if not exist "%LAUNCHER%" set "LAUNCHER=%GAME_ROOT%launcher.ps1"
if not exist "%LAUNCHER%" (
  echo.
  echo [START FAILED] Missing app\launcher.ps1.
  echo Extract the complete ZIP to a normal folder and try again.
  echo.
  pause
  exit /b 2
)
if defined WAVES_DUEL_DEBUG echo LAUNCHER=%LAUNCHER%
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%LAUNCHER%"
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" (
  echo.
  echo [START FAILED] Exit code %EXIT_CODE%. The root cause is shown above as [LAUNCHER ERROR].
  echo Take a screenshot including the ?Error:? line if you need support.
  echo.
  pause
)
exit /b %EXIT_CODE%
