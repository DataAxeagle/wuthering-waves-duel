@echo off
setlocal
set "GAME_ROOT=%~dp0"
set "LAUNCHER=%GAME_ROOT%app\launcher.ps1"
if not exist "%LAUNCHER%" set "LAUNCHER=%GAME_ROOT%launcher.ps1"
if not exist "%LAUNCHER%" (
  echo.
  echo [CONFIG FAILED] Missing app\launcher.ps1.
  echo Extract the complete ZIP to a normal folder and try again.
  echo.
  pause
  exit /b 2
)
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%LAUNCHER%" -ConfigureAI
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" (
  echo.
  echo [CONFIG FAILED] Exit code %EXIT_CODE%. The detailed error is shown above.
  echo Take a screenshot of this window if you need support.
  echo.
  pause
)
exit /b %EXIT_CODE%
