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
echo [2] Starting Bridge on http://127.0.0.1:5055 ...
echo     Connecting Cloud Web App to DIGORA Optime scanner...
echo.
node "%~dp0digora_lan_bridge.js" %1
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo [Bridge Exited] Press any key to restart or close.
  pause
)
