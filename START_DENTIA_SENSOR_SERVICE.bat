@echo off
title Dentia Intraoral Sensor ^& Hardware Bridge Service
color 0A
cls
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
echo  [FLOW 2/4] Initializing FTDI D2XX Kernel Driver ^& Hardware Bus...
echo  [FLOW 3/4] Monitoring Dynamic Hot-Folders (D:\PatientData, C:\Eighteeth\Export)...
echo  [FLOW 4/4] Streaming live exposures to https://dentistfrontend.vercel.app/chart/45
echo.
echo ===============================================================================
echo  BRIDGE ACTIVE ^| Press CTRL+C to stop service
echo ===============================================================================
echo.
cd /d "%~dp0"
node nanopix_usb_bridge.cjs
pause
