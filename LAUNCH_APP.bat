@echo off
echo ==========================================
echo STARTING DENTIA WEB SERVER ^& HARDWARE BRIDGE
echo ==========================================
echo.

:: Stop existing Node servers to avoid port conflicts
taskkill /F /IM node.exe /T 2>nul
taskkill /F /IM NanoPix.exe /T 2>nul

echo Starting Hardware Bridge...
start "Hardware Bridge" cmd /c "npm run bridge"

echo Starting Vite Web Server...
start "Vite Server" cmd /c "npm run dev"

echo.
echo Servers started successfully!
echo Please open your browser, refresh the page (F5), and click the "Launch Eighteeth App" button.
echo The UI will now appear on your desktop.
pause
