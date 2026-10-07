@echo off
title Eighteeth Nano-Pix Real-Time Exposure Monitor
color 0E
cls
cd /d "%~dp0"
echo ====================================================================
echo   EIGHTEETH NANO-PIX 2 REAL-TIME LIVE EXPOSURE MONITOR
echo ====================================================================
echo.
echo  [1/2] Checking Eighteeth NanoPix Engine...
tasklist /fi "imagename eq NanoPix.exe" 2>NUL | find /i "NanoPix.exe" >NUL
if "%ERRORLEVEL%"=="0" (
    echo   ✔ NanoPix.exe is running.
) else (
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
echo  [2/2] Listening for X-ray exposure shots ^& USB sensor data...
echo.
node monitor_nanopix_live.cjs
pause
