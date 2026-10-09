@echo off
title Eighteeth Nano-Pix 2 Hardware Auto-Sync Bridge
color 0B
cls
cd /d "%~dp0"
echo ====================================================================
echo   EIGHTEETH NANO-PIX 2 HARDWARE ^& HOT-FOLDER AUTO-SYNC BRIDGE
echo ====================================================================
echo.

:: ── PRE-CHECK 1: Node.js installed? ──────────────────────────────────────
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo  [FAIL] Node.js is NOT installed on this PC!
    echo.
    echo  Node.js is required to run the Dentia Hardware Bridge.
    echo  Please install Node.js (LTS) from:  https://nodejs.org
    echo  After installing Node.js, re-run this file.
    echo.
    echo [%DATE% %TIME%] FAIL: Node.js not found on PATH > "%~dp0dentia_bridge_log.txt"
    pause
    exit /b 1
)

:: ── PRE-CHECK 2: Bridge script present? ──────────────────────────────────
if not exist "%~dp0nanopix_usb_bridge.cjs" (
    color 0C
    echo.
    echo  [FAIL] nanopix_usb_bridge.cjs not found in this folder!
    echo  Expected location: %~dp0nanopix_usb_bridge.cjs
    echo.
    echo  Ensure the complete Dentia project folder is on this PC.
    echo  Contact your admin or download the full setup package.
    echo.
    echo [%DATE% %TIME%] FAIL: nanopix_usb_bridge.cjs not found > "%~dp0dentia_bridge_log.txt"
    pause
    exit /b 1
)

:: ── PRE-CHECK 3: NanoPix.exe present? (warn, not fatal) ──────────────────
if not exist "%~dp0drivers\eighteeth_engine\NanoPix.exe" (
    if not exist "%~dp0drivers\eighteeth_engine\1.1.1.9\NanoPix.exe" (
        echo.
        echo  [WARN] NanoPix.exe not found in drivers\eighteeth_engine\
        echo  The bridge will run but NanoPix software will not auto-launch.
        echo  You can start NanoPix manually if needed.
        echo [%DATE% %TIME%] WARN: NanoPix.exe not found >> "%~dp0dentia_bridge_log.txt"
        echo.
    )
)

echo.
echo  [1/3] Checking Eighteeth NanoPix Acquisition Engine...
tasklist /fi "imagename eq NanoPix.exe" 2>NUL | find /i "NanoPix.exe" >NUL
if "%ERRORLEVEL%"=="0" (
    echo   [OK] NanoPix.exe engine is already active and armed in background.
) else (
    echo   [STARTING] Launching Eighteeth Official NanoPix UI...
    if exist "%USERPROFILE%\Downloads\NanoPix\NanoPix\1.1.1.9\NanoPix.exe" (
        start "" /d "%USERPROFILE%\Downloads\NanoPix\NanoPix\1.1.1.9" "%USERPROFILE%\Downloads\NanoPix\NanoPix\1.1.1.9\NanoPix.exe"
    ) else if exist "C:\NanoPix\1.1.1.9\NanoPix.exe" (
        start "" /d "C:\NanoPix\1.1.1.9" "C:\NanoPix\1.1.1.9\NanoPix.exe"
    ) else if exist "%~dp0drivers\eighteeth_engine\1.1.1.9\NanoPix.exe" (
        start "" /d "%~dp0drivers\eighteeth_engine\1.1.1.9" "%~dp0drivers\eighteeth_engine\1.1.1.9\NanoPix.exe"
    ) else if exist "%~dp0drivers\eighteeth_engine\NanoPix.exe" (
        start "" /d "%~dp0drivers\eighteeth_engine" "%~dp0drivers\eighteeth_engine\NanoPix.exe"
    ) else if exist "%USERPROFILE%\Downloads\NanoPix\NanoPix\Launch.exe" (
        start "" /d "%USERPROFILE%\Downloads\NanoPix\NanoPix" "%USERPROFILE%\Downloads\NanoPix\NanoPix\Launch.exe"
    ) else if exist "C:\NanoPix\Launch.exe" (
        start "" /d "C:\NanoPix" "C:\NanoPix\Launch.exe"
    ) else (
        echo   [WARN] NanoPix.exe not found in any known location. Bridge will still run.
        echo   Install NanoPix software from Eighteeth if X-ray capture is needed.
    )
)
echo.
echo  [2/3] Initializing FTDI USB D2XX Kernel Bus (Port: 5066)...
echo  [3/3] Dynamic Hot-Folders ^& Real-time Web Stream active.
echo.
echo ====================================================================
echo   BRIDGE READY ^| Shoot X-Ray tube to stream directly to Dentia
echo ====================================================================
echo.
echo [%DATE% %TIME%] START_NANOPIX_AUTO_SYNC.bat starting node bridge... >> "%~dp0dentia_bridge_log.txt"
node nanopix_usb_bridge.cjs
pause
