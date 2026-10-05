@echo off
title EIGHTEETH NANO-PIX HARDWARE & SENSOR DIAGNOSTIC TOOL
color 0B
cls

echo ===================================================================
echo   EIGHTEETH NANO-PIX (NANOPIX 1 & 2) HARDWARE DIAGNOSTIC SUITE
echo   Dentia Intraoral RVG Studio
echo ===================================================================
echo.

node test_nanopix_hardware.cjs

echo.
echo ===================================================================
echo   Press any key to close this test window...
echo ===================================================================
pause >nul
