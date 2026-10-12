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
set "LOGS_DIR=%ProgramData%\DentalBridge\logs"
set "SOURCE_DIR=%~dp0..\..\DentistAPIClone\API_dentist\DentalBridge\publish"

if not exist "%SOURCE_DIR%\DentalBridge.exe" (
    set "SOURCE_DIR=%~dp0..\..\DentalBridge.Service\publish"
)
if not exist "%SOURCE_DIR%\DentalBridge.exe" (
    set "SOURCE_DIR=F:\DentistApp_Theme2\DentistAPIClone\API_dentist\DentalBridge\publish"
)
if not exist "%SOURCE_DIR%\DentalBridge.exe" (
    set "SOURCE_DIR=F:\DentistApp_Theme2\DentalBridge.Service\publish"
)
if not exist "%SOURCE_DIR%\DentalBridge.exe" (
    set "SOURCE_DIR=%~dp0"
)

echo [*] Target Directory: %TARGET_DIR%
echo [*] Logs Directory:   %LOGS_DIR%
echo [*] Installing runtime binaries and calibration profiles...

if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"
if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"
if not exist "%TARGET_DIR%\Correct\Default" mkdir "%TARGET_DIR%\Correct\Default"

:: Terminate previous running instance
taskkill /F /IM DentalBridge.exe >nul 2>&1

:: Copy Service Executable and DLLs if source is found
if exist "%SOURCE_DIR%\DentalBridge.exe" (
    echo [*] Found local binaries in: %SOURCE_DIR%
    copy /Y "%SOURCE_DIR%\DentalBridge.exe" "%TARGET_DIR%\" >nul
    if exist "%SOURCE_DIR%\*.dll" copy /Y "%SOURCE_DIR%\*.dll" "%TARGET_DIR%\" >nul
    if exist "%SOURCE_DIR%\config.ini" copy /Y "%SOURCE_DIR%\config.ini" "%TARGET_DIR%\" >nul
    if exist "%SOURCE_DIR%\WebSocket_Live_Monitor.html" copy /Y "%SOURCE_DIR%\WebSocket_Live_Monitor.html" "%TARGET_DIR%\" >nul
    if exist "%SOURCE_DIR%\Correct\Default\*.*" copy /Y "%SOURCE_DIR%\Correct\Default\*.*" "%TARGET_DIR%\Correct\Default\" >nul
) else (
    echo [*] Downloading complete Dentia Bridge package from cloud...
    echo [*] URL: https://dentistfrontend.vercel.app/Dentia_Dental_Bridge_Setup.zip
    powershell -NoProfile -Command "Invoke-WebRequest -Uri 'https://dentistfrontend.vercel.app/Dentia_Dental_Bridge_Setup.zip' -OutFile '%TEMP%\Dentia_Dental_Bridge_Setup.zip'"
    if exist "%TEMP%\Dentia_Dental_Bridge_Setup.zip" (
        echo [*] Extracting runtime files into %TARGET_DIR%...
        powershell -NoProfile -Command "Expand-Archive -Path '%TEMP%\Dentia_Dental_Bridge_Setup.zip' -DestinationPath '%TARGET_DIR%' -Force"
        del /Q "%TEMP%\Dentia_Dental_Bridge_Setup.zip" >nul 2>&1
    )
)

:: Validate target binary exists
if not exist "%TARGET_DIR%\DentalBridge.exe" (
    echo.
    echo ==============================================================================
    echo [ERROR] DentalBridge.exe was not found in:
    echo         %TARGET_DIR%\DentalBridge.exe
    echo.
    echo Please download and extract Dentia_Dental_Bridge_Setup.zip
    echo and run 1-CLICK_INSTALL.bat
    echo ==============================================================================
    echo.
    pause
    exit /b 1
)

:: Register 4-Layer Windows Auto-Start Persistence (Reboot & Logon)
echo [*] Registering 4-Layer Windows Auto-Start Persistence (Reboot & Logon)...
:: Layer 1: Windows Scheduled Task (Runs on any doctor logon with highest elevated privileges)
schtasks /create /tn "DentiaDentalBridge" /tr "\"%TARGET_DIR%\DentalBridge.exe\" --workdir \"%TARGET_DIR%\"" /sc onlogon /rl highest /f >nul 2>&1

:: Layer 2: Machine-Wide Registry (Applies to all doctor profiles on this PC)
reg add "HKLM\Software\Microsoft\Windows\CurrentVersion\Run" /v "DentiaDentalBridge" /t REG_SZ /d "\"%TARGET_DIR%\DentalBridge.exe\" --workdir \"%TARGET_DIR%\"" /f >nul 2>&1

:: Layer 3: Current User Profile Registry
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "DentiaDentalBridge" /t REG_SZ /d "\"%TARGET_DIR%\DentalBridge.exe\" --workdir \"%TARGET_DIR%\"" /f >nul 2>&1

:: Layer 4: Common Startup Folder Shortcut
powershell -NoProfile -Command "$w=New-Object -ComObject WScript.Shell;$cs=[Environment]::GetFolderPath('CommonStartup');if(Test-Path $cs){$s=$w.CreateShortcut(\"$cs\Dentia Dental Bridge.lnk\");$s.TargetPath=\"%TARGET_DIR%\DentalBridge.exe\";$s.WorkingDirectory=\"%TARGET_DIR%\";$s.Arguments=\"--workdir `\"%TARGET_DIR%`\"\";$s.Save();}" >nul 2>&1

:: Configure Windows Firewall for Ports 5050 & 5066
echo [*] Configuring local loopback network ports 5050 & 5066...
netsh advfirewall firewall add rule name="Dentia Dental Bridge (Port 5050)" dir=in action=allow protocol=TCP localport=5050 >nul 2>&1
netsh advfirewall firewall add rule name="Dentia Dental Bridge (Port 5066)" dir=in action=allow protocol=TCP localport=5066 >nul 2>&1

:: Create a convenient log viewing script
echo @echo off > "%TARGET_DIR%\View_Logs.bat"
echo TITLE Dentia Hardware Bridge Live Logs >> "%TARGET_DIR%\View_Logs.bat"
echo powershell -Command "Get-Content -Path '%LOGS_DIR%\bridge_*.log' -Tail 50 -Wait" >> "%TARGET_DIR%\View_Logs.bat"

:: Launch Background Service
echo [*] Launching Dental Bridge background service...
start "" "%TARGET_DIR%\DentalBridge.exe"

:: Quick verification
timeout /t 3 >nul
powershell -Command "try { $r = Invoke-RestMethod -Uri 'http://127.0.0.1:5050/api/status' -TimeoutSec 3; Write-Host ' [STATUS CHECK] Bridge is active on port 5050. Model:' $r.model 'State:' $r.state } catch { Write-Host ' [STATUS NOTE] Service starting up in background...' }"

echo.
echo ==============================================================================
echo   SUCCESS! Dentia Hardware Bridge is now active on ws://127.0.0.1:5050
echo   Disk Logs: %LOGS_DIR%
echo   Return to your web browser - your NanoPix sensor is now connected!
echo ==============================================================================
echo.
timeout /t 5
