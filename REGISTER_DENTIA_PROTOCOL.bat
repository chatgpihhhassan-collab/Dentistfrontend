@echo off
title Register Dentia Hardware Protocol Handler
color 0B
cls
cd /d "%~dp0"

echo ===============================================================================
echo     DENTIA HARDWARE PROTOCOL ^& ONE-CLICK AUTO-LAUNCH INSTALLER
echo ===============================================================================
echo.
echo  Configuring 1-Click Browser Auto-Launch (dentia-hw://) for:
echo  https://dentistfrontend.vercel.app/ and local dev.
echo.

set "SCRIPT_DIR=%~dp0"
set "LAUNCH_VBS=%SCRIPT_DIR%scripts\silent_bridge_launcher.vbs"
set "STARTUP_VBS=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\DentiaNanoPixBridge.vbs"

:: Clean any previous instance first
if exist "%SCRIPT_DIR%UNINSTALL_DENTIA_PROTOCOL.bat" (
    call "%SCRIPT_DIR%UNINSTALL_DENTIA_PROTOCOL.bat" /quiet
)

if not exist "%SCRIPT_DIR%scripts" (
    mkdir "%SCRIPT_DIR%scripts"
)

:: 1. Create Silent VBScript Launcher
echo Creating silent background runner at: "%LAUNCH_VBS%"
(
    echo Set WshShell = CreateObject^("WScript.Shell"^)
    echo WshShell.CurrentDirectory = "%SCRIPT_DIR%"
    echo WshShell.Run "cmd.exe /c node nanopix_usb_bridge.cjs", 0, False
) > "%LAUNCH_VBS%"

:: 2. Copy to Windows Startup Folder (so it boots silently with Windows)
echo Registering auto-start on Windows boot...
copy /Y "%LAUNCH_VBS%" "%STARTUP_VBS%" >nul

:: 3. Register Custom Protocol (dentia-hw://) in Windows Registry (CurrentUser - No Admin Required!)
echo Registering browser protocol handler: "dentia-hw://"
reg add "HKCU\Software\Classes\dentia-hw" /ve /d "URL:Dentia Hardware Protocol" /f >nul
reg add "HKCU\Software\Classes\dentia-hw" /v "URL Protocol" /d "" /f >nul
reg add "HKCU\Software\Classes\dentia-hw\shell\open\command" /ve /d "wscript.exe \"%LAUNCH_VBS%\"" /f >nul

:: 4. Start the bridge right now
echo.
echo [STARTING] Launching Hardware Bridge in background...
wscript.exe "%LAUNCH_VBS%"
ping 127.0.0.1 -n 3 >nul

echo.
echo ===============================================================================
echo  ✅ SETUP COMPLETE!
echo.
echo  1. "dentia-hw://" protocol is registered.
echo  2. Background auto-sync is active on port 5066.
echo  3. Will start automatically whenever this PC is turned on.
echo.
echo  Doctors can now click "Connect Hardware" on https://dentistfrontend.vercel.app/
echo  and it will sync with zero manual commands!
echo ===============================================================================
echo.
if "%~1"=="/quiet" goto :EOF
pause
