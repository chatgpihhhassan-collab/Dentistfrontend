<#
.SYNOPSIS
    Dentia Hardware Agent — Auto-Diagnostic Script
    Checks every prerequisite for the NanoPix Bridge and reports PASS/FAIL.
    Read-only: does NOT modify registry, patient data, or any config file.
    Results are written locally to dentia_diagnostics.json and dentia_bridge_log.txt.
    Optionally serves results on http://localhost:5067 (60-second window) so the
    browser modal can fetch them automatically.

.NOTES
    - Does NOT require Node.js (fully PowerShell)
    - Does NOT send data to any remote server
    - Run as: .\DENTIA_DIAGNOSE.ps1
      or via: DENTIA_DIAGNOSE.bat (launches this script with correct ExecutionPolicy)
#>

Set-StrictMode -Off
$ErrorActionPreference = 'SilentlyContinue'

$scriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Definition
$projectRoot = $scriptDir   # diagnose script lives in project root
$logPath     = Join-Path $projectRoot "dentia_bridge_log.txt"
$jsonPath    = Join-Path $projectRoot "dentia_diagnostics.json"

function Write-Log($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path $logPath -Value "[$ts] [DIAGNOSE] $msg"
}

function Check($label, $passed, $detail = '') {
    $status = if ($passed) { 'PASS' } else { 'FAIL' }
    $icon   = if ($passed) { '[OK]  ' } else { '[FAIL]' }
    Write-Host "$icon $label$(if ($detail) { ": $detail" } else { '' })" -ForegroundColor $(if ($passed) { 'Green' } else { 'Red' })
    Write-Log "$status $label$(if ($detail) { ": $detail" } else { '' })"
    return @{ label = $label; passed = $passed; detail = $detail; status = $status }
}

# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   DENTIA HARDWARE AGENT — AUTO-DIAGNOSTIC REPORT" -ForegroundColor Cyan
Write-Host "   $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Log "=== Diagnostic run started ==="

$results = [ordered]@{}

# ── CHECK 1: Node.js installed ────────────────────────────────────────────────
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
$nodeVer = if ($nodeCmd) { (node --version 2>$null) } else { $null }
$nodeOk  = ($null -ne $nodeCmd) -and ($null -ne $nodeVer)
$r = Check 'Node.js installed' $nodeOk $(if ($nodeOk) { $nodeVer } else { 'node not found on PATH — install from https://nodejs.org' })
$results['nodejs_installed'] = $r.status
$results['nodejs_version']   = if ($nodeOk) { $nodeVer } else { 'NOT FOUND' }

# ── CHECK 2: nanopix_usb_bridge.cjs present ──────────────────────────────────
$bridgeScript = Join-Path $projectRoot "nanopix_usb_bridge.cjs"
$r = Check 'nanopix_usb_bridge.cjs exists' (Test-Path $bridgeScript) $(if (!(Test-Path $bridgeScript)) { "Missing: $bridgeScript" })
$results['bridge_script_exists'] = $r.status

# ── CHECK 3: REGISTER_DENTIA_PROTOCOL.bat present ────────────────────────────
$regBat = Join-Path $projectRoot "REGISTER_DENTIA_PROTOCOL.bat"
$r = Check 'REGISTER_DENTIA_PROTOCOL.bat exists' (Test-Path $regBat)
$results['register_bat_exists'] = $r.status

# ── CHECK 4: START_NANOPIX_AUTO_SYNC.bat present ─────────────────────────────
$syncBat = Join-Path $projectRoot "START_NANOPIX_AUTO_SYNC.bat"
$r = Check 'START_NANOPIX_AUTO_SYNC.bat exists' (Test-Path $syncBat)
$results['sync_bat_exists'] = $r.status

# ── CHECK 5: silent_bridge_launcher.vbs present ──────────────────────────────
$vbsPath = Join-Path $projectRoot "scripts\silent_bridge_launcher.vbs"
$r = Check 'silent_bridge_launcher.vbs exists' (Test-Path $vbsPath)
$results['launcher_vbs_exists'] = $r.status

# ── CHECK 6: VBS does NOT have old hardcoded path ────────────────────────────
$vbsHardcoded = $false
if (Test-Path $vbsPath) {
    $vbsContent = Get-Content $vbsPath -Raw
    # Check if it still has a hardcoded absolute path (e.g. D:\... or C:\Users\something\...)
    # The portable version uses fso.GetParentFolderName — no absolute path needed
    if ($vbsContent -match 'CurrentDirectory\s*=\s*"[A-Za-z]:\\') {
        $vbsHardcoded = $true
    }
}
$r = Check 'VBS launcher is portable (no hardcoded path)' (!$vbsHardcoded) $(if ($vbsHardcoded) { 'Re-run REGISTER_DENTIA_PROTOCOL.bat to regenerate portable VBS' })
$results['vbs_is_portable'] = $r.status

# ── CHECK 7: dentia-hw:// protocol registered in registry ────────────────────
$regKey = 'HKCU:\Software\Classes\dentia-hw\shell\open\command'
$regExists = Test-Path $regKey
$regVal    = if ($regExists) { (Get-ItemProperty -Path $regKey -ErrorAction SilentlyContinue).'(default)' } else { '' }
$r = Check 'dentia-hw:// protocol in registry' $regExists $(if ($regVal) { "Points to: $regVal" } else { 'Not registered — run REGISTER_DENTIA_PROTOCOL.bat' })
$results['protocol_registered'] = $r.status
$results['protocol_command']    = if ($regVal) { $regVal } else { 'NOT REGISTERED' }

# ── CHECK 8: Registered VBS path actually exists ─────────────────────────────
$regVbsOk = $false
if ($regExists -and $regVal) {
    if ($regVal -match '"([^"]+\.vbs)"') {
        $registeredVbs = $Matches[1]
        $regVbsOk = Test-Path $registeredVbs
        $r = Check 'Registry VBS path exists on disk' $regVbsOk $(if (!$regVbsOk) { "File not found: $registeredVbs — re-run REGISTER_DENTIA_PROTOCOL.bat" } else { $registeredVbs })
    } else {
        $r = Check 'Registry VBS path exists on disk' $false 'Could not parse path from registry value'
    }
    $results['registry_vbs_path_exists'] = $r.status
}

# ── CHECK 9: node_modules present (for koffi/serialport) ─────────────────────
$nodeModules = Join-Path $projectRoot "node_modules"
$r = Check 'node_modules directory exists' (Test-Path $nodeModules) $(if (!(Test-Path $nodeModules)) { 'Run: npm install in project folder' })
$results['node_modules_exists'] = $r.status

# ── CHECK 10: NanoPix.exe present ────────────────────────────────────────────
$nanoPixPaths = @(
    (Join-Path $projectRoot "drivers\eighteeth_engine\NanoPix.exe"),
    (Join-Path $projectRoot "drivers\eighteeth_engine\1.1.1.9\NanoPix.exe"),
    (Join-Path $env:USERPROFILE "Downloads\NanoPix\NanoPix\1.1.1.9\NanoPix.exe"),
    "C:\NanoPix\1.1.1.9\NanoPix.exe"
)
$foundNanoPix = $nanoPixPaths | Where-Object { Test-Path $_ } | Select-Object -First 1
$r = Check 'NanoPix.exe found' ($null -ne $foundNanoPix) $(if ($foundNanoPix) { $foundNanoPix } else { 'Install Eighteeth NanoPix software' })
$results['nanopix_exe_found']  = $r.status
$results['nanopix_exe_path']   = if ($foundNanoPix) { $foundNanoPix } else { 'NOT FOUND' }

# ── CHECK 11: Port 5066 free or bridge running ────────────────────────────────
$port5066 = Get-NetTCPConnection -LocalPort 5066 -State Listen -ErrorAction SilentlyContinue
$bridgeProcess = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like '*nanopix_usb_bridge.cjs*' }
$bridgeRunning = ($null -ne $bridgeProcess)
$port5066Used  = ($null -ne $port5066)
$r = Check 'Port 5066 / Bridge status' ($bridgeRunning -or !$port5066Used) $(
    if ($bridgeRunning) { "Bridge IS running (PID: $($bridgeProcess.ProcessId))" }
    elseif ($port5066Used) { "Port busy by another process (PID: $($port5066.OwningProcess))" }
    else { "Port free, bridge NOT running" }
)
$results['bridge_running']  = $(if ($bridgeRunning) { 'PASS' } else { 'FAIL' })
$results['port_5066_free']  = $(if (!$port5066Used -or $bridgeRunning) { 'PASS' } else { 'FAIL' })

# ── CHECK 12: FTDI USB device detected ───────────────────────────────────────
$ftdiDevice = Get-PnpDevice -PresentOnly -ErrorAction SilentlyContinue |
    Where-Object { $_.InstanceId -like 'USB\VID_0403&PID_6014*' }
$r = Check 'FTDI USB device (VID:0403 PID:6014)' ($null -ne $ftdiDevice) $(
    if ($ftdiDevice) { "Device: $($ftdiDevice.FriendlyName)" } else { 'Sensor not plugged in, or FTDI driver not installed' }
)
$results['ftdi_usb_detected'] = $r.status

# ── CHECK 13: FTDI D2XX driver installed ──────────────────────────────────────
$ftdiDll = Test-Path "C:\Windows\System32\ftd2xx.dll"
$r = Check 'FTDI D2XX driver (ftd2xx.dll)' ($ftdiDll -or ($null -ne $ftdiDevice))  $(
    if ($ftdiDll) { 'Found in System32' } elseif ($ftdiDevice) { 'Device found (driver may be in-box)' } else { 'Install FTDI D2XX driver from ftdichip.com' }
)
$results['ftdi_driver_installed'] = $r.status

# ── CHECK 14: PatientData folder accessible ───────────────────────────────────
$pdPaths = @('D:\PatientData', 'C:\PatientData')
$pdFound = $pdPaths | Where-Object { Test-Path $_ } | Select-Object -First 1
$r = Check 'PatientData folder exists' ($null -ne $pdFound) $(if ($pdFound) { $pdFound } else { 'Will be created by bridge on first run' })
$results['patient_data_folder'] = $r.status

# ── CHECK 15: Windows Startup entry present ───────────────────────────────────
$startupVbs = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Startup\DentiaNanoPixBridge.vbs"
$r = Check 'Windows Startup entry (DentiaNanoPixBridge.vbs)' (Test-Path $startupVbs) $(
    if (!(Test-Path $startupVbs)) { 'Run REGISTER_DENTIA_PROTOCOL.bat for auto-start on boot' }
)
$results['startup_entry'] = $r.status

# ── CHECK 16: Zone.Identifier (Mark of the Web) on key files ─────────────────
$zoneFiles = @($bridgeScript, $regBat, $syncBat, $vbsPath) | Where-Object { $_ -and (Test-Path $_) }
$blocked = $zoneFiles | Where-Object { Test-Path "$_`:Zone.Identifier" }
$r = Check 'No files blocked by SmartScreen' ($blocked.Count -eq 0) $(
    if ($blocked.Count -gt 0) { "Blocked: $($blocked -join ', ') — Right-click > Properties > Unblock" }
)
$results['smartscreen_blocked'] = if ($blocked.Count -eq 0) { 'PASS' } else { 'FAIL' }
$results['blocked_files'] = if ($blocked.Count -gt 0) { ($blocked -join '; ') } else { 'none' }

# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
$passCount = ($results.Values | Where-Object { $_ -eq 'PASS' }).Count
$failCount = ($results.Values | Where-Object { $_ -eq 'FAIL' }).Count
Write-Host "  RESULT: $passCount PASS / $failCount FAIL" -ForegroundColor $(if ($failCount -eq 0) { 'Green' } else { 'Yellow' })
Write-Host "================================================================" -ForegroundColor Cyan

# ── Save JSON result ──────────────────────────────────────────────────────────
$jsonObj = [ordered]@{
    generated  = (Get-Date -Format 'o')
    machine    = $env:COMPUTERNAME
    user       = $env:USERNAME
    projectRoot= $projectRoot
    checks     = $results
    summary    = @{ pass = $passCount; fail = $failCount }
}
$jsonObj | ConvertTo-Json -Depth 4 | Set-Content -Path $jsonPath -Encoding UTF8
Write-Host ""
Write-Host "  Results saved to: $jsonPath" -ForegroundColor Gray
Write-Host "  Log appended to:  $logPath" -ForegroundColor Gray
Write-Log "=== Diagnostic complete: $passCount PASS / $failCount FAIL ==="

# ─────────────────────────────────────────────────────────────────────────────
# Optional: Serve results on port 5067 for 60s so browser modal can fetch them
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  Starting diagnostic HTTP listener on port 5067 (60 seconds)..." -ForegroundColor Cyan
Write-Host "  Browser modal will auto-fetch results if bridge is not running." -ForegroundColor Gray
Write-Host "  Press Ctrl+C to stop early." -ForegroundColor Gray
Write-Host ""

try {
    $listener = [System.Net.HttpListener]::new()
    $listener.Prefixes.Add('http://localhost:5067/')
    $listener.Start()
    
    $json     = $jsonObj | ConvertTo-Json -Depth 4
    $deadline = (Get-Date).AddSeconds(60)
    
    while ((Get-Date) -lt $deadline -and $listener.IsListening) {
        $ctxTask = $listener.GetContextAsync()
        # Poll every 500ms so we can respect deadline
        while (!$ctxTask.IsCompleted -and (Get-Date) -lt $deadline) {
            Start-Sleep -Milliseconds 500
        }
        if (!$ctxTask.IsCompleted) { break }
        
        $ctx  = $ctxTask.Result
        $req  = $ctx.Request
        $res  = $ctx.Response
        
        $res.Headers.Add('Access-Control-Allow-Origin', '*')
        $res.Headers.Add('Access-Control-Allow-Private-Network', 'true')
        $res.Headers.Add('Access-Control-Allow-Headers', '*')
        
        if ($req.HttpMethod -eq 'OPTIONS') {
            $res.StatusCode = 204
            $res.Close()
            continue
        }
        
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
        $res.ContentType     = 'application/json'
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
        $res.Close()
        
        Write-Host "  [$(Get-Date -Format 'HH:mm:ss')] Served diagnostics to browser." -ForegroundColor Green
    }
    
    $listener.Stop()
} catch {
    Write-Host "  (Port 5067 listener skipped: $_)" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "  Done. Share dentia_diagnostics.json or dentia_bridge_log.txt if issues persist." -ForegroundColor Cyan
Write-Host ""
