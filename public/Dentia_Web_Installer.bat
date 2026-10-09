@echo off
:: ==============================================================================
:: DENTIA HARDWARE BRIDGE - 1-CLICK INSTANT CLINIC INSTALLER
:: Eighteeth NanoPix 1.5 & NanoPix 2 Direct Web USB Integration
:: ==============================================================================
TITLE Dentia Dental Hardware Bridge Installer
color 0A

echo ==============================================================================
echo   DENTIA HARDWARE BRIDGE - AUTOMATED 1-CLICK CLINIC SETUP
echo   Zero Desktop App Required - Direct Browser RVG Sensor Capture
echo ==============================================================================
echo.

set "TARGET_DIR=%ProgramData%\DentalBridge\bin"
set "SOURCE_DIR=%~dp0..\..\DentalBridge.Service\publish"

:: If running standalone or downloaded from web server, fallback to current folder
if not exist "%SOURCE_DIR%\DentalBridge.exe" (
    set "SOURCE_DIR=%~dp0"
)

echo [*] Target Directory: %TARGET_DIR%
echo [*] Installing runtime binaries and calibration profiles...

if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"
if not exist "%TARGET_DIR%\Correct\Default" mkdir "%TARGET_DIR%\Correct\Default"

:: Terminate previous running instance
taskkill /F /IM DentalBridge.exe >nul 2>&1

:: Copy Service Executable and DLLs
if exist "%SOURCE_DIR%\DentalBridge.exe" (
    copy /Y "%SOURCE_DIR%\DentalBridge.exe" "%TARGET_DIR%\" >nul
)
if exist "%SOURCE_DIR%\*.dll" (
    copy /Y "%SOURCE_DIR%\*.dll" "%TARGET_DIR%\" >nul
)
if exist "%SOURCE_DIR%\config.ini" (
    copy /Y "%SOURCE_DIR%\config.ini" "%TARGET_DIR%\" >nul
)
if exist "%SOURCE_DIR%\Correct\Default\*.*" (
    copy /Y "%SOURCE_DIR%\Correct\Default\*.*" "%TARGET_DIR%\Correct\Default\" >nul
)

:: Register Windows Startup (Current User Run Key)
echo [*] Registering Windows Auto-Start...
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "DentiaDentalBridge" /t REG_SZ /d "\"%TARGET_DIR%\DentalBridge.exe\"" /f >nul 2>&1

:: Configure Windows Firewall for Port 5050
echo [*] Configuring local loopback network port 5050...
netsh advfirewall firewall add rule name="Dentia Dental Bridge (Port 5050)" dir=in action=allow protocol=TCP localport=5050 >nul 2>&1

:: Launch Background Service Immediately
echo [*] Launching Dental Bridge background service...
start "" "%TARGET_DIR%\DentalBridge.exe"

echo.
echo ==============================================================================
echo   SUCCESS! Dentia Hardware Bridge is now active on ws://127.0.0.1:5050
echo   Return to your web browser - your NanoPix sensor is now connected!
echo ==============================================================================
echo.
timeout /t 5
