@echo off
title Dentia Hardware Bridge Auto-Installer
color 0B
echo ========================================================
echo        DENTIA HARDWARE BRIDGE (FULL INSTALLER)
echo ========================================================
echo.
echo This installer will download the full NanoPix software
echo and setup the bridge automatically. Please wait...
echo.

set BASE_URL=https://dentistfrontend.vercel.app

echo [1/3] Downloading DentiaBridge_Part1.bin...
curl -f -# -O "%BASE_URL%/DentiaBridge_Part1.bin" || (echo Error downloading DentiaBridge_Part1.bin! Check internet connection. & pause & exit)
echo [2/3] Downloading DentiaBridge_Part2.bin...
curl -f -# -O "%BASE_URL%/DentiaBridge_Part2.bin" || (echo Error downloading DentiaBridge_Part2.bin! Check internet connection. & pause & exit)
echo [3/3] Downloading DentiaBridge_Part3.bin...
curl -f -# -O "%BASE_URL%/DentiaBridge_Part3.bin" || (echo Error downloading DentiaBridge_Part3.bin! Check internet connection. & pause & exit)

echo.
echo [1/3] Combining downloaded chunks into ZIP...
copy /b DentiaBridge_Part1.bin + DentiaBridge_Part2.bin + DentiaBridge_Part3.bin DentiaBridge_Setup.zip >nul

echo [2/3] Extracting files (This may take a minute)...
if exist "DentiaBridge" rmdir /s /q "DentiaBridge"
powershell -NoProfile -Command "Expand-Archive -Path 'DentiaBridge_Setup.zip' -DestinationPath 'DentiaBridge' -Force"

echo [3/3] Installing Bridge Service...
cd DentiaBridge
call REGISTER_DENTIA_PROTOCOL.bat

echo.
echo ========================================================
echo ✅ INSTALLATION COMPLETE!
echo You can now click "Launch Hardware Agent" on the website.
echo ========================================================
pause
