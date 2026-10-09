@echo off
title Dentia Hardware Agent — Auto-Diagnostics
color 0B
cls
cd /d "%~dp0"

echo ================================================================
echo   DENTIA HARDWARE AGENT — AUTO-DIAGNOSTIC TOOL
echo ================================================================
echo.
echo  This tool checks every prerequisite for the NanoPix Bridge.
echo  READ-ONLY: nothing is modified, no data is sent anywhere.
echo  Results saved to: dentia_diagnostics.json
echo  Log appended to:  dentia_bridge_log.txt
echo.
echo  Starting checks...
echo.

:: Run PowerShell diagnostic script with Bypass execution policy
:: The -File flag uses the bat's own directory so no hardcoded paths
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0DENTIA_DIAGNOSE.ps1"

echo.
if %ERRORLEVEL% EQU 0 (
    echo  Diagnostics complete. See output above.
    echo  Share dentia_diagnostics.json or dentia_bridge_log.txt if needed.
) else (
    echo  PowerShell script failed to run ^(error %ERRORLEVEL%^).
    echo  Try: right-click DENTIA_DIAGNOSE.bat ^> Run as Administrator
)
echo.
pause
