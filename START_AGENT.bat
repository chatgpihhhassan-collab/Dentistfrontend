@echo off
title Dentia Local Hardware Agent (Port 5055)
color 0A
cls
cd /d "%~dp0"

echo ===============================================================================
echo     DENTIA CLINIC PC HARDWARE AGENT (PORT 5055)
echo ===============================================================================
echo.
echo  Listening on: http://127.0.0.1:5055
echo  Ready to launch NanoPix.exe on button click from https://dentistfrontend.vercel.app
echo.
echo  Press Ctrl+C to stop the agent.
echo ===============================================================================
echo.

node agent\server.js

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Agent terminated with error code %ERRORLEVEL%.
    pause
)
