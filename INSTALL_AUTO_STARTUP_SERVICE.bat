@echo off
title Install Dentia NanoPix Bridge Auto-Startup
color 0A
cls
echo ===============================================================================
echo     INSTALL DENTIA NANO-PIX BRIDGE TO WINDOWS STARTUP - AUTO-START
echo ===============================================================================
echo.
echo  This script registers the NanoPix USB hardware bridge to start automatically
echo  in the background whenever this computer boots up or the user logs in.
echo.

set "SCRIPT_DIR=%~dp0"
set "VBS_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\DentiaNanoPixBridge.vbs"

echo Creating silent background launcher at:
echo "%VBS_PATH%"
echo.

echo Set WshShell = CreateObject("WScript.Shell") > "%VBS_PATH%"
echo WshShell.CurrentDirectory = "%SCRIPT_DIR%" >> "%VBS_PATH%"
echo WshShell.Run "node nanopix_usb_bridge.cjs", 0, False >> "%VBS_PATH%"

if exist "%VBS_PATH%" (
    echo [SUCCESS] Dentia Nano-Pix Hardware Bridge is now configured to start automatically on Windows boot!
    echo.
    echo Starting the bridge now in the background...
    wscript "%VBS_PATH%"
    echo [OK] Bridge service started in background.
) else (
    echo [ERROR] Failed to write to Startup folder.
)

echo.
echo ===============================================================================
echo Setup complete. Press any key to exit.
pause >nul
