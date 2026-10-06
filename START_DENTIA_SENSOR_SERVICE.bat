@echo off
title Dentia Intraoral Sensor & X-Ray Hardware Service
color 0A
echo ================================================================
echo    DENTIA CLINICAL HARDWARE BRIDGE & AUTO-DRIVER ENGINE
echo    Eighteeth Nano-Pix 1 / 2, Soredex DIGORA, Dexis RVG
echo ================================================================
echo.
echo [1/2] Initializing FTDI D2XX USB Drivers & Background Engine...
cd /d "%~dp0"
node nanopix_usb_bridge.cjs
pause
