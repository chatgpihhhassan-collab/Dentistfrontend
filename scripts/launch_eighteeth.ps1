# Eighteeth Nano-Pix Official GUI Launcher (Dental Radiography Software)
# Directly breaks existing instances and executes: drivers\eighteeth_engine\NanoPix.exe

$projectRoot = (Resolve-Path "$PSScriptRoot\..").Path

# 1. Break / terminate any running instances first
try {
    taskkill /F /IM NanoPix.exe /IM Launch.exe /IM AutoUpdate.exe /T 2>&1 | Out-Null
} catch {}

$targetGuiExe = Join-Path $projectRoot "drivers\eighteeth_engine\NanoPix.exe"
if (-not (Test-Path $targetGuiExe)) {
    $targetGuiExe = Join-Path $projectRoot "drivers\eighteeth_engine\1.1.1.9\NanoPix.exe"
}

if (-not (Test-Path $targetGuiExe)) {
    Write-Output "ERROR: Target Eighteeth executable not found in drivers\eighteeth_engine\NanoPix.exe."
    exit 1
}

$workingDir = Split-Path -Parent $targetGuiExe

# 2. Launch fresh interactive GUI window in user desktop session
try {
    Start-Process -FilePath $targetGuiExe -WorkingDirectory $workingDir -WindowStyle Normal
    Write-Output "LAUNCHED: Successfully launched Eighteeth Desktop App: $targetGuiExe"
} catch {
    cmd.exe /c "start `"`" /d `"$workingDir`" `"$targetGuiExe`""
    Write-Output "LAUNCHED: Invoked Eighteeth Desktop App via CMD: $targetGuiExe"
}
