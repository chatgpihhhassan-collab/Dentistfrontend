# Eighteeth Nano-Pix Official GUI Launcher (Dental Radiography Software)
# Prioritize official Launch.exe and NanoPix.exe in installed paths, Downloads, and workspace

$candidateGuiPaths = @(
    "C:\NanoPix\Launch.exe",
    "$env:USERPROFILE\Downloads\NanoPix\NanoPix\Launch.exe",
    "$PSScriptRoot\..\drivers\eighteeth_engine\Launch.exe",
    "C:\NanoPix\1.1.1.9\NanoPix.exe",
    "$env:USERPROFILE\Downloads\NanoPix\NanoPix\1.1.1.9\NanoPix.exe",
    "$PSScriptRoot\..\drivers\eighteeth_engine\1.1.1.9\NanoPix.exe",
    "$PSScriptRoot\..\drivers\eighteeth_engine\NanoPix.exe",
    "$PSScriptRoot\..\drivers\nanopix\1.1.1.9\NanoPix.exe",
    "$PSScriptRoot\..\drivers\nanopix\NanoPix.exe"
)

$targetGuiExe = $null
foreach ($path in $candidateGuiPaths) {
    if (Test-Path $path) {
        $targetGuiExe = (Resolve-Path $path).Path
        break
    }
}

if (-not $targetGuiExe) {
    Write-Output "ERROR: Target Eighteeth executable not found."
    exit 1
}

$workingDir = Split-Path -Parent $targetGuiExe

# 1. Check if a live GUI window instance of NanoPix is already open
$visibleProc = Get-Process -Name NanoPix, Launch -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1

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
$hiddenProcs = Get-Process -Name NanoPix, Launch -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 }
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
