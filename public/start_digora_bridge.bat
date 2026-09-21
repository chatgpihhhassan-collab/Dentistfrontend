@echo off
title Soredex DIGORA Optime Ethernet Bridge - Option B
color 0A
cls
echo ===================================================================
echo   SOREDEX DIGORA OPTIME - CLINIC ETHERNET BRIDGE (OPTION B)
echo   Dentia Dental Cloud Workspace
echo ===================================================================
echo.
echo [1] Verifying Node.js environment...
node -v >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Node.js is required to run the DIGORA Bridge.
  echo Please install Node.js from https://nodejs.org
  echo.
  pause
  exit /b 1
)
echo     Node.js is detected.
echo.

:: Automatically fetch digora_lan_bridge.cjs if not already in the same folder
if not exist "%~dp0digora_lan_bridge.cjs" (
  echo [2] Downloading DIGORA bridge engine (digora_lan_bridge.cjs)...
  powershell -NoProfile -Command "try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://dentistfrontend.vercel.app/digora_lan_bridge.cjs' -OutFile '%~dp0digora_lan_bridge.cjs' -UseBasicParsing; Write-Host '    Bridge engine downloaded successfully.' } catch { Write-Warning $_ }"
)

echo [3] Starting Bridge on http://127.0.0.1:5055 ...
echo     Connecting Cloud Web App to DIGORA Optime countertop scanner...
echo.

if exist "%~dp0digora_lan_bridge.cjs" (
  node "%~dp0digora_lan_bridge.cjs" %*
) else if exist "%~dp0digora_lan_bridge.js" (
  node "%~dp0digora_lan_bridge.js" %*
) else (
  echo [ERROR] Could not locate digora_lan_bridge.cjs.
  echo Please download digora_lan_bridge.cjs from the web app or check your internet connection.
  pause
  exit /b 1
)

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo [Bridge Exited] Press any key to restart or close.
  pause
)
