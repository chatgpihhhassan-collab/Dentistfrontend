@echo off
title Eighteeth Nano-Pix 2 Hardware Auto-Sync Bridge
color 0B
cls
echo ====================================================================
echo   EIGHTEETH NANO-PIX 2 HARDWARE ^& HOT-FOLDER AUTO-SYNC BRIDGE
echo ====================================================================
echo.
echo  - Port: 5066
echo  - USB Target: FTDI FT232H (VID: 0x0403, PID: 0x6014)
echo  - Hot-Folder: d:\dentistfrontend\Dentistfrontend\nanopix_scans
echo  - Status: Arming sensor and listening for exposures...
echo.
node nanopix_usb_bridge.cjs
pause
