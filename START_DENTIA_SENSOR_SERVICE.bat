@echo off
title Dentia Intraoral Sensor ^& Hardware Bridge Service
color 0A
cls
cd /d "%~dp0"
echo ===============================================================================
echo     DENTIA CLINICAL HARDWARE BRIDGE ^& REAL-TIME SENSOR ACQUISITION
echo     Eighteeth Nano-Pix 1 / 2 ^| Soredex DIGORA ^| Dexis RVG ^| Carestream
echo ===============================================================================
echo.
echo  [FLOW 1/4] Checking Node.js runtime environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH! Please install Node.js.
    pause
    exit /b
)

echo  [FLOW 2/4] Ensuring Eighteeth Sensor Engine is running (Minimized)...
tasklist /fi "imagename eq NanoPix.exe" 2>NUL | find /i "NanoPix.exe" >NUL
if "%ERRORLEVEL%"=="0" (
    echo   ✔ NanoPix.exe Acquisition Engine is Active in Background.
) else (
    echo   ▶ Launching Eighteeth Hardware Acquisition Engine...
    if exist "C:\NanoPix\Launch.exe" (
        start "" /d "C:\NanoPix" "C:\NanoPix\Launch.exe"
    ) else if exist "%USERPROFILE%\Downloads\NanoPix\NanoPix\Launch.exe" (
        start "" /d "%USERPROFILE%\Downloads\NanoPix\NanoPix" "%USERPROFILE%\Downloads\NanoPix\NanoPix\Launch.exe"
    ) else if exist "%~dp0drivers\eighteeth_engine\Launch.exe" (
        start "" /d "%~dp0drivers\eighteeth_engine" "%~dp0drivers\eighteeth_engine\Launch.exe"
    ) else if exist "%~dp0drivers\eighteeth_engine\NanoPix.exe" (
        start "" /d "%~dp0drivers\eighteeth_engine" "%~dp0drivers\eighteeth_engine\NanoPix.exe"
    )
)

echo  [FLOW 3/4] Initializing FTDI D2XX Kernel Driver ^& Hardware Bus (Port: 5066)...
echo  [FLOW 4/4] Monitoring Dynamic Hot-Folders (D:\PatientData, C:\Eighteeth\Export)...
echo.
echo ===============================================================================
echo  BRIDGE ACTIVE ^| Press CTRL+C to stop service
echo ===============================================================================
echo.
node nanopix_usb_bridge.cjs
pause
