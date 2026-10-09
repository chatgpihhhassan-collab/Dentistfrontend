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

:: ── PRE-CHECK: Node.js installed? ─────────────────────────────────────────
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo  [!] FAIL: Node.js is NOT installed on this PC!
    echo  [!] Node.js is required to run the Dentia Hardware Bridge.
    echo.
    echo  Please install Node.js ^(LTS^) from: https://nodejs.org
    echo  After installing Node.js, re-run this file.
    echo.
    echo [%DATE% %TIME%] FAIL: Node.js not found >> "%SCRIPT_DIR%dentia_bridge_log.txt"
    echo.
    pause
    exit /b 1
)

:: ── PRE-CHECK: nanopix_usb_bridge.cjs present? ────────────────────────────
if not exist "%SCRIPT_DIR%nanopix_usb_bridge.cjs" (
    color 0C
    echo.
    echo  [!] FAIL: nanopix_usb_bridge.cjs not found in this folder!
    echo  Expected: %SCRIPT_DIR%nanopix_usb_bridge.cjs
    echo.
    echo  Ensure the complete Dentia project folder is present on this PC.
    echo.
    pause
    exit /b 1
)

:: Clean any previous instance first
if exist "%SCRIPT_DIR%UNINSTALL_DENTIA_PROTOCOL.bat" (
    call "%SCRIPT_DIR%UNINSTALL_DENTIA_PROTOCOL.bat" /quiet
)

if not exist "%SCRIPT_DIR%scripts" (
    mkdir "%SCRIPT_DIR%scripts"
)

:: ── 1. Create PORTABLE Silent VBScript Launcher ───────────────────────────
:: IMPORTANT: Uses VBScript's own path detection — NO hardcoded paths.
:: This works on ANY PC regardless of drive letter or folder location.
echo Creating portable silent background runner at: "%LAUNCH_VBS%"
(
    echo ' Dentia NanoPix Bridge Launcher — Portable ^(auto-generated^)
    echo Set WshShell = CreateObject^("WScript.Shell"^)
    echo Set fso = CreateObject^("Scripting.FileSystemObject"^)
    echo Dim sF, pR
    echo sF = fso.GetParentFolderName^(WScript.ScriptFullName^)
    echo pR = fso.GetParentFolderName^(sF^)
    echo Dim lp : lp = pR ^& "\dentia_bridge_log.txt"
    echo On Error Resume Next
    echo Dim lf : Set lf = fso.OpenTextFile^(lp, 8, True^)
    echo lf.WriteLine "[" ^& Now^(^) ^& "] [LAUNCHER] Bridge triggered from: " ^& pR
    echo lf.Close : On Error GoTo 0
    echo WshShell.CurrentDirectory = pR
    echo WshShell.Run "cmd.exe /c node nanopix_usb_bridge.cjs ^>^> """ ^& lp ^& """ 2^>^&1", 0, False
) > "%LAUNCH_VBS%"

:: ── 2. Copy to Windows Startup Folder (auto-start on boot) ───────────────
echo Registering auto-start on Windows boot...
copy /Y "%LAUNCH_VBS%" "%STARTUP_VBS%" >nul

:: ── 3. Register Custom Protocol in Windows Registry (no admin needed) ────
echo Registering browser protocol handler: "dentia-hw://"
reg add "HKCU\Software\Classes\dentia-hw" /ve /d "URL:Dentia Hardware Protocol" /f >nul
reg add "HKCU\Software\Classes\dentia-hw" /v "URL Protocol" /d "" /f >nul
reg add "HKCU\Software\Classes\dentia-hw\shell\open\command" /ve /d "wscript.exe \"%LAUNCH_VBS%\"" /f >nul

:: ── 4. Verify registry was written ───────────────────────────────────────
reg query "HKCU\Software\Classes\dentia-hw\shell\open\command" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   OK - dentia-hw:// protocol verified in registry.
) else (
    echo   WARNING - Registry write may have failed. Try running as Administrator.
)

:: ── 5. Start the bridge right now ────────────────────────────────────────
echo.
echo [STARTING] Launching Hardware Bridge in background...
wscript.exe "%LAUNCH_VBS%"
ping 127.0.0.1 -n 4 >nul

echo.
echo ===============================================================================
echo  OK SETUP COMPLETE!
echo.
echo  1. "dentia-hw://" protocol is registered.
echo  2. Background auto-sync is active on port 5066.
echo  3. Will start automatically whenever this PC is turned on.
echo.
echo  Doctors can now click "Connect Hardware" on https://dentistfrontend.vercel.app/
echo  and it will sync with zero manual commands!
echo ===============================================================================
echo.
echo [%DATE% %TIME%] REGISTER_DENTIA_PROTOCOL completed OK >> "%SCRIPT_DIR%dentia_bridge_log.txt"
if "%~1"=="/quiet" goto :EOF
pause
