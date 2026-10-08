@echo off
title Uninstall Dentia Hardware Protocol ^& Auto-Startup
color 0C
cls
cd /d "%~dp0"

echo ===============================================================================
echo       UNINSTALL DENTIA HARDWARE PROTOCOL ^& AUTO-STARTUP SERVICE
echo ===============================================================================
echo.

set "SCRIPT_DIR=%~dp0"
set "LAUNCH_VBS=%SCRIPT_DIR%scripts\silent_bridge_launcher.vbs"
set "STARTUP_VBS=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\DentiaNanoPixBridge.vbs"

echo  [1/4] Stopping running bridge and hardware processes...
taskkill /F /IM NanoPix.exe /T 2>nul
taskkill /F /FI "WINDOWTITLE eq *nanopix_usb_bridge*" /T 2>nul
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*nanopix_usb_bridge.cjs*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" 2>nul

echo  [2/4] Removing Windows Startup auto-start launcher...
if exist "%STARTUP_VBS%" (
    del /f /q "%STARTUP_VBS%" >nul 2>&1
    echo        ✓ Removed Startup VBS: "%STARTUP_VBS%"
) else (
    echo        ✓ No Startup VBS file found.
)

if exist "%LAUNCH_VBS%" (
    del /f /q "%LAUNCH_VBS%" >nul 2>&1
    echo        ✓ Removed script runner: "%LAUNCH_VBS%"
)

echo  [3/4] Removing "dentia-hw://" browser protocol from Windows Registry...
reg query "HKCU\Software\Classes\dentia-hw" >nul 2>&1
if "%ERRORLEVEL%"=="0" (
    reg delete "HKCU\Software\Classes\dentia-hw" /f >nul 2>&1
    echo        ✓ Removed registry key: HKCU\Software\Classes\dentia-hw
) else (
    echo        ✓ Protocol was not registered.
)

echo  [4/4] Verifying port 5066 release...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5066 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" 2>nul

echo.
echo ===============================================================================
echo  ✅ UNINSTALL COMPLETE!
echo.
echo  Dentia Hardware Protocol and background auto-startup have been removed.
echo ===============================================================================
echo.
if "%~1"=="/quiet" goto :EOF
pause
