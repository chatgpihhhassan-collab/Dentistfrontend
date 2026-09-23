@echo off
setlocal enabledelayedexpansion
title SOREDEX DIGORA OPTIME - COMPLETE SYSTEM VERIFICATION SUITE
color 0A
cls

:: Target default IP
set "SCANNER_IP=192.168.0.100"
if not "%~1"=="" set "SCANNER_IP=%~1"

:MENU
cls
echo ======================================================================
echo    SOREDEX DIGORA(R) OPTIME -- COMPLETE 8-STEP SYSTEM VERIFICATION
echo    Dentia Dental Cloud Workspace ^| Chairside Hardware Diagnostics
echo ======================================================================
echo.
echo  Target Scanner IP : %SCANNER_IP%
echo  Bridge Endpoint   : http://127.0.0.1:5055
echo  Web Application   : http://localhost:5173
echo.
echo ----------------------------------------------------------------------
echo  SELECT AN ACTION:
echo ----------------------------------------------------------------------
echo  [1] RUN FULL 8-STEP SYSTEM VERIFICATION (Check All Layers)
echo  [2] TEST HARDWARE ACOUSTIC BEEP (Verify Physical Scanner Sound)
echo  [3] ARM SCANNER FOR 2-MINUTE PLATE STRIP (Doctor Chairside Test)
echo  [4] DISARM / RESET SCANNER HARDWARE (Return to Standby 0x0000)
echo  [5] LAUNCH DENTIA CLOUD WEB APP (http://localhost:5173)
echo  [6] START / RESTART DIGORA BRIDGE DAEMON (Port 5055)
echo  [7] CHANGE TARGET SCANNER IP (Current: %SCANNER_IP%)
echo  [0] EXIT
echo ----------------------------------------------------------------------
echo.
set /p "CHOICE=Enter choice [1-7, 0] (Default is 1): "
if "%CHOICE%"=="" set "CHOICE=1"

if "%CHOICE%"=="1" goto RUN_VERIFY
if "%CHOICE%"=="2" goto RUN_BEEP
if "%CHOICE%"=="3" goto RUN_ARM
if "%CHOICE%"=="4" goto RUN_RESET
if "%CHOICE%"=="5" goto RUN_APP
if "%CHOICE%"=="6" goto RUN_BRIDGE
if "%CHOICE%"=="7" goto CHANGE_IP
if "%CHOICE%"=="0" goto QUIT

echo [!] Invalid selection. Please try again.
timeout /t 2 >nul
goto MENU

:: -------------------------------------------------------------------------
:RUN_VERIFY
:: -------------------------------------------------------------------------
cls
echo [INFO] Running Complete 8-Step Verification Suite on %SCANNER_IP%...
echo.

node -v >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  node "%~dp0verify_all_steps.cjs" %SCANNER_IP%
) else (
  echo [WARN] Node.js not detected in PATH. Executing PowerShell fallback diagnostics...
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0TEST_DIGORA_DEVICE.bat" %SCANNER_IP%
)

echo.
echo ======================================================================
echo  Verification complete.
echo ======================================================================
echo.
pause
goto MENU

:: -------------------------------------------------------------------------
:RUN_BEEP
:: -------------------------------------------------------------------------
cls
echo ======================================================================
echo   TESTING PHYSICAL SCANNER BEEP (IP: %SCANNER_IP%)
echo ======================================================================
echo.
echo [1] Sending hardware BEEP command via s2ConfigureDevice & Bridge API...
node -v >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  node "%~dp0verify_all_steps.cjs" %SCANNER_IP% --beep
) else (
  powershell -Command "try { $r = Invoke-RestMethod -Uri 'http://127.0.0.1:5055/digora/beep?ip=%SCANNER_IP%'; Write-Host 'Result:' ($r | ConvertTo-Json) } catch { Write-Host 'Error:' $_.Exception.Message }"
)
echo.
echo Look at and listen to the physical DIGORA Optime countertop scanner.
echo The machine will emit an acoustic BEEP sound and wake its optical shutter.
echo.
pause
goto MENU

:: -------------------------------------------------------------------------
:RUN_ARM
:: -------------------------------------------------------------------------
cls
echo ======================================================================
echo   ARMING SCANNER FOR 2-MINUTE PLATE STRIP INSERTION (IP: %SCANNER_IP%)
echo ======================================================================
echo.
echo [1] Setting 120-second lease window for doctor...
node -v >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  node "%~dp0verify_all_steps.cjs" %SCANNER_IP% --arm
) else (
  powershell -Command "try { $r = Invoke-RestMethod -Uri 'http://127.0.0.1:5055/digora/arm' -Method POST -Body '{\"patientId\":\"CHAIRSIDE-TEST\",\"scannerIp\":\"%SCANNER_IP%\",\"durationMinutes\":2}' -ContentType 'application/json'; Write-Host 'Result:' ($r | ConvertTo-Json) } catch { Write-Host 'Error:' $_.Exception.Message }"
)
echo.
echo ----------------------------------------------------------------------
echo CHAIRSIDE INSTRUCTIONS:
echo 1. The top vertical slot is now unlocked and ARMED for 2 minutes (120s).
echo 2. Drop the exposed phosphor plate strip into the top vertical slot.
echo 3. The scanner will pull the plate, scan, and release into the tray.
echo ----------------------------------------------------------------------
echo.
pause
goto MENU

:: -------------------------------------------------------------------------
:RUN_RESET
:: -------------------------------------------------------------------------
cls
echo ======================================================================
echo   RESETTING / DISARMING SCANNER TO STANDBY (IP: %SCANNER_IP%)
echo ======================================================================
echo.
node -v >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  node "%~dp0verify_all_steps.cjs" %SCANNER_IP% --reset
) else (
  powershell -Command "try { $r = Invoke-RestMethod -Uri 'http://127.0.0.1:5055/digora/reset' -Method POST -Body '{\"scannerIp\":\"%SCANNER_IP%\"}' -ContentType 'application/json'; Write-Host 'Result:' ($r | ConvertTo-Json) } catch { Write-Host 'Error:' $_.Exception.Message }"
)
echo.
echo [OK] Scanner hardware reset to standby (state 0x0000 IDLE).
echo.
pause
goto MENU

:: -------------------------------------------------------------------------
:RUN_APP
:: -------------------------------------------------------------------------
cls
echo [INFO] Opening Dentia Web Application at http://localhost:5173...
start http://localhost:5173
timeout /t 2 >nul
goto MENU

:: -------------------------------------------------------------------------
:RUN_BRIDGE
:: -------------------------------------------------------------------------
cls
echo ======================================================================
echo   STARTING SOREDEX DIGORA HARDWARE BRIDGE DAEMON
echo ======================================================================
echo.
echo Launching Bridge listening on http://127.0.0.1:5055 (Target: %SCANNER_IP%)...
start "DIGORA Bridge Daemon (Port 5055)" cmd /k "node \"%~dp0digora_lan_bridge.cjs\" %SCANNER_IP%"
echo.
echo [OK] Bridge launched in dedicated console window.
timeout /t 3 >nul
goto MENU

:: -------------------------------------------------------------------------
:CHANGE_IP
:: -------------------------------------------------------------------------
cls
echo Current Scanner IP: %SCANNER_IP%
set /p "NEW_IP=Enter new DIGORA IP (e.g. 192.168.0.100 or 192.168.1.120): "
if not "%NEW_IP%"=="" set "SCANNER_IP=%NEW_IP%"
goto MENU

:QUIT
exit /b 0
