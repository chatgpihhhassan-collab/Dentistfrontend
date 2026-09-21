@echo off
title Soredex DIGORA Optime - Hardware & Door Diagnostics
color 0B
cls

echo ===================================================================
echo   SOREDEX DIGORA OPTIME - HARDWARE & DOOR TEST (CLINIC PC)
echo   Dentia Dental Cloud Workspace
echo ===================================================================
echo.
echo This tool will test your physical DIGORA Optime countertop scanner,
echo detect its network IP, and send the motor command to open the door.
echo.

:: Ensure test_digora_hardware.cjs is present next to this batch file
if not exist "%~dp0test_digora_hardware.cjs" (
  echo [Info] Fetching latest diagnostic engine (test_digora_hardware.cjs)...
  powershell -NoProfile -Command "try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://dentistfrontend.vercel.app/test_digora_hardware.cjs' -OutFile '%~dp0test_digora_hardware.cjs' -UseBasicParsing; Write-Host '    Diagnostic engine downloaded.' } catch { Write-Warning $_ }"
)

:: Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo [WARNING] Node.js not found in PATH.
  echo Running PowerShell native diagnostic...
  echo.
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Write-Host 'Testing physical connection to DIGORA Optime (192.168.1.120)...'; Test-NetConnection -ComputerName 192.168.1.120 -Port 104 -WarningAction SilentlyContinue | Format-List"
  echo.
  pause
  exit /b 0
)

echo Menu Options:
echo  [1] Run Auto-Discovery and Test Door Open (Default: 192.168.1.120 / 192.168.0.x)
echo  [2] Enter Specific Scanner IP Address to Test & Open Door
echo  [3] Run Continuous 15-Second Door Open Loop (Watch the machine motor)
echo  [4] Exit
echo.
set /p CHOICE="Choose an option [1, 2, 3, or 4] (Press ENTER for 1): "

if "%CHOICE%"=="2" goto custom_ip
if "%CHOICE%"=="3" goto loop_test
if "%CHOICE%"=="4" exit /b 0

:default_test
echo.
echo Running diagnostics on default Soredex IP and local subnet...
node "%~dp0test_digora_hardware.cjs"
goto finish

:custom_ip
echo.
set /p TARGET_IP="Enter your Soredex DIGORA Optime IP address: "
if "%TARGET_IP%"=="" set TARGET_IP=192.168.1.120
echo.
echo Testing DIGORA Optime at %TARGET_IP% ...
node "%~dp0test_digora_hardware.cjs" %TARGET_IP%
goto finish

:loop_test
echo.
echo [CONTINUOUS MOTOR LOOP] Sending motor wake/open sequence every 2 seconds...
echo Look at your DIGORA Optime machine now!
echo Press Ctrl+C at any time to stop.
echo.
for /l %%x in (1, 1, 8) do (
  echo [%%x/8] Transmitting motor door open packet to 192.168.1.120...
  node "%~dp0test_digora_hardware.cjs" 192.168.1.120
  timeout /t 2 /nobreak >nul
)
goto finish

:finish
echo.
echo ===================================================================
echo Diagnostics complete. Look at the output above for results.
echo ===================================================================
pause
