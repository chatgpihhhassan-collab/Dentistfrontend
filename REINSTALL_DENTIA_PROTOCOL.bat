@echo off
title Clean Reinstall Dentia Hardware Protocol ^& Auto-Startup
color 0B
cls
cd /d "%~dp0"

echo ===============================================================================
echo     CLEAN REINSTALL - DENTIA HARDWARE PROTOCOL ^& AUTO-STARTUP SERVICE
echo ===============================================================================
echo.
echo  Target: https://dentistfrontend.vercel.app/ ^& Local Dev
echo.

set "SCRIPT_DIR=%~dp0"
set "LAUNCH_VBS=%SCRIPT_DIR%scripts\silent_bridge_launcher.vbs"
set "STARTUP_VBS=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\DentiaNanoPixBridge.vbs"

echo  --- STEP 1: CLEAN UNINSTALL PREVIOUS INSTALLATION ---
call "%SCRIPT_DIR%UNINSTALL_DENTIA_PROTOCOL.bat" /quiet
echo.

echo  --- STEP 2: FRESH REINSTALLATION ---
if not exist "%SCRIPT_DIR%scripts" (
    mkdir "%SCRIPT_DIR%scripts"
)

echo  [1/4] Generating fresh portable silent background launcher...
(
    echo ' Dentia NanoPix Bridge Launcher ^(Portable — auto-generated^)
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
echo        ✓ Created: "%LAUNCH_VBS%"

echo  [2/4] Registering auto-start in Windows Startup folder...
copy /Y "%LAUNCH_VBS%" "%STARTUP_VBS%" >nul
echo        ✓ Installed in Startup folder.

echo  [3/4] Registering fresh "dentia-hw://" protocol in Windows Registry...
reg add "HKCU\Software\Classes\dentia-hw" /ve /d "URL:Dentia Hardware Protocol" /f >nul
reg add "HKCU\Software\Classes\dentia-hw" /v "URL Protocol" /d "" /f >nul
reg add "HKCU\Software\Classes\dentia-hw\shell\open\command" /ve /d "wscript.exe \"%LAUNCH_VBS%\"" /f >nul
echo        ✓ Registered HKCU\Software\Classes\dentia-hw

echo  [4/4] Starting fresh background Hardware Bridge on port 5066...
wscript.exe "%LAUNCH_VBS%"
ping 127.0.0.1 -n 3 >nul

echo.
echo ===============================================================================
echo  ✅ CLEAN REINSTALL COMPLETE!
echo.
echo  1. "dentia-hw://" protocol is freshly registered.
echo  2. Background auto-sync is active on port 5066.
echo  3. Bridge will auto-start whenever this PC boots up.
echo.
echo  Doctors can now click "Connect Hardware" on https://dentistfrontend.vercel.app/
echo ===============================================================================
echo.
if "%~1"=="/quiet" goto :EOF
pause
