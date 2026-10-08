# Dentia Local Hardware Agent - Windows Task Scheduler & Startup Installer
# Registers the Agent to start automatically on Windows User Log-on in the interactive desktop session (Session 1).

$ErrorActionPreference = "Continue"

$taskName = "DentiaLocalAgent"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$agentServerScript = Join-Path $scriptDir "agent\server.js"
$nodePath = (Get-Command node -ErrorAction SilentlyContinue).Source

if (-not $nodePath) {
    if (Test-Path "C:\Program Files\nodejs\node.exe") {
        $nodePath = "C:\Program Files\nodejs\node.exe"
    } elseif (Test-Path "C:\Program Files (x86)\nodejs\node.exe") {
        $nodePath = "C:\Program Files (x86)\nodejs\node.exe"
    } else {
        Write-Error "Node.js executable was not found in PATH. Please install Node.js first."
        exit 1
    }
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  DENTIA LOCAL AGENT - INSTALLATION (PORT 5055)" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Task Name:    $taskName"
Write-Host " Node Path:    $nodePath"
Write-Host " Agent Script: $agentServerScript"
Write-Host " Working Dir:  $scriptDir"
Write-Host ""

# Check if running with Administrator privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

$registeredTask = $false

# 1. Attempt Task Scheduler Registration
try {
    # Remove previous task if exists
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

    $action = New-ScheduledTaskAction -Execute $nodePath -Argument "agent\server.js" -WorkingDirectory $scriptDir
    $trigger = New-ScheduledTaskTrigger -AtLogOn

    if ($isAdmin) {
        $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest
    } else {
        $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive
    }

    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Days 365)
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "Dentia Clinic PC Local Hardware Bridge on port 5055" | Out-Null

    Write-Host "✅ [1/2] Windows Scheduled Task '$taskName' successfully registered." -ForegroundColor Green
    Start-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    $registeredTask = $true
} catch {
    Write-Host "⚠️ Task Scheduler registration requires Admin. Using Windows User Startup folder fallback..." -ForegroundColor Yellow
}

# 2. Windows Startup Folder Runner (Guaranteed 100% Zero-Admin Startup)
$startupFolder = [System.IO.Path]::Combine($env:APPDATA, "Microsoft\Windows\Start Menu\Programs\Startup")
$startupVbs = Join-Path $startupFolder "DentiaLocalAgent.vbs"

$vbsContent = @"
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "$scriptDir"
WshShell.Run "node agent\server.js", 0, False
"@

[System.IO.File]::WriteAllText($startupVbs, $vbsContent)
Write-Host "✅ [2/2] Auto-Start Runner created at: $startupVbs" -ForegroundColor Green

# 3. Start the Agent right now if not already running
try {
    $existingPort = Get-NetTCPConnection -LocalPort 5055 -ErrorAction SilentlyContinue
    if (-not $existingPort) {
        Write-Host "Starting agent now..." -ForegroundColor Cyan
        Start-Process -FilePath $nodePath -ArgumentList "agent\server.js" -WorkingDirectory $scriptDir -WindowStyle Hidden
    }
} catch {
    Start-Process -FilePath $nodePath -ArgumentList "agent\server.js" -WorkingDirectory $scriptDir -WindowStyle Hidden
}

Start-Sleep -Seconds 2

# Verify Health
try {
    $resp = Invoke-RestMethod -Uri "http://127.0.0.1:5055/health" -Method Get -TimeoutSec 3
    if ($resp.ok) {
        Write-Host ""
        Write-Host "=================================================================" -ForegroundColor Cyan
        Write-Host "  ✅ SUCCESS! Dentia Local Agent is ACTIVE on http://127.0.0.1:5055" -ForegroundColor Green
        Write-Host "  Ready to launch NanoPix from https://dentistfrontend.vercel.app/" -ForegroundColor Green
        Write-Host "=================================================================" -ForegroundColor Cyan
    }
} catch {
    Write-Host "Agent started. You can run START_AGENT.bat to view console logs." -ForegroundColor Yellow
}
