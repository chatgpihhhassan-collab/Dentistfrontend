@echo off
color 0B
cls

echo ===================================================================
echo   SOREDEX DIGORA OPTIME - HARDWARE AND DOOR DIAGNOSTIC TOOL
echo   Dentia Dental Cloud Workspace
echo ===================================================================
echo.
echo [1] Checking Node.js runtime...
node -v >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo [WARNING] Node.js is not in PATH. Running PowerShell diagnostic...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Write-Host 'Pinging DIGORA at 192.168.1.120 and 192.168.0.120...'; Test-Connection -ComputerName 192.168.1.120, 192.168.0.120 -Count 1 -Quiet"
  echo.
  pause
  exit /b 0
)

echo     Node.js is detected.
echo.
echo [2] Starting hardware diagnostic scan...
echo.

node "%~dp0test_digora_hardware.cjs" %*

echo.
echo ===================================================================
echo   Test finished. Press any key to close this window.
echo ===================================================================
pause
