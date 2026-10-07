@echo off
title Eighteeth Nano-Pix 2 Hardware Auto-Sync Bridge
color 0B
cls
cd /d "%~dp0"
echo ====================================================================
echo   EIGHTEETH NANO-PIX 2 HARDWARE ^& HOT-FOLDER AUTO-SYNC BRIDGE
echo ====================================================================
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
node nanopix_usb_bridge.cjs
pause
