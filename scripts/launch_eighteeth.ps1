# Eighteeth Nano-Pix Official GUI Launcher (Dental Radiography Software)
# Directly executes: drivers\eighteeth_engine\1.1.1.9\NanoPix.exe

$projectRoot = (Resolve-Path "$PSScriptRoot\..").Path

$targetGuiExe = Join-Path $projectRoot "drivers\eighteeth_engine\1.1.1.9\NanoPix.exe"
if (-not (Test-Path $targetGuiExe)) {
    $targetGuiExe = Join-Path $projectRoot "drivers\eighteeth_engine\NanoPix.exe"
}

if (-not (Test-Path $targetGuiExe)) {
    Write-Output "ERROR: Target Eighteeth executable not found in drivers\eighteeth_engine\1.1.1.9\NanoPix.exe."
    exit 1
}

$workingDir = Split-Path -Parent $targetGuiExe

# 1. Check if a live GUI window instance of NanoPix is already open
$visibleProc = Get-Process -Name NanoPix -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1

if ($visibleProc) {
    # Bring existing GUI window to the foreground
    try {
        $ws = New-Object -ComObject WScript.Shell
        $ws.AppActivate($visibleProc.Id) | Out-Null
        Write-Output "ACTIVATED: Brought existing Eighteeth window (PID $($visibleProc.Id)) to foreground."
        exit 0
    } catch {
        # Fall through to relaunch if activation fails
    }
}

# 2. If any hidden / ghost instances of NanoPix are running without a window, terminate them to free the single-instance mutex
$hiddenProcs = Get-Process -Name NanoPix -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 }
if ($hiddenProcs) {
    foreach ($p in $hiddenProcs) {
        try {
            Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
        } catch {
        }
    }
    Start-Sleep -Milliseconds 300
}

# 3. Launch fresh interactive GUI window in user desktop session
try {
    Start-Process -FilePath $targetGuiExe -WorkingDirectory $workingDir -WindowStyle Normal
    Write-Output "LAUNCHED: Successfully launched Eighteeth Desktop App: $targetGuiExe"
} catch {
    # Fallback to CMD start
    cmd.exe /c "start `"`" /d `"$workingDir`" `"$targetGuiExe`""
    Write-Output "LAUNCHED: Invoked Eighteeth Desktop App via CMD: $targetGuiExe"
}
