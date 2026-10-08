# Eighteeth Nano-Pix Official GUI Launcher
$candidatePaths = @(
    "$PSScriptRoot\..\drivers\eighteeth_engine\NanoPix.exe",
    "$PSScriptRoot\..\drivers\eighteeth_engine\1.1.1.9\NanoPix.exe",
    "$PSScriptRoot\..\drivers\eighteeth_engine\Launch.exe",
    "$PSScriptRoot\..\drivers\nanopix\1.1.1.9\NanoPix.exe",
    "$PSScriptRoot\..\drivers\nanopix\NanoPix.exe",
    "$env:USERPROFILE\Downloads\NanoPix\NanoPix\1.1.1.9\NanoPix.exe",
    "$env:USERPROFILE\Downloads\NanoPix\NanoPix\Launch.exe",
    "$env:USERPROFILE\Downloads\NanoPix\NanoPix\NanoPix.exe",
    "C:\NanoPix\1.1.1.9\NanoPix.exe",
    "C:\NanoPix\Launch.exe",
    "C:\NanoPix\NanoPix.exe",
    "D:\NanoPix\1.1.1.9\NanoPix.exe",
    "D:\NanoPix\Launch.exe",
    "D:\NanoPix\NanoPix.exe",
    "C:\Program Files\Eighteeth\NanoPix.exe",
    "C:\Program Files (x86)\Eighteeth\NanoPix.exe"
)

$targetExe = $null
foreach ($path in $candidatePaths) {
    if (Test-Path $path) {
        $targetExe = (Resolve-Path $path).Path
        break
    }
}

if (-not $targetExe) {
    Write-Output "ERROR: Target Eighteeth executable not found."
    exit 1
}

$workingDir = Split-Path -Parent $targetExe

# Check if a live GUI window instance is already open
$existing = Get-Process -Name NanoPix, FinCloud, Launch -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1

if ($existing) {
    # Activate and bring existing GUI window to front
    $ws = New-Object -ComObject WScript.Shell
    $ws.AppActivate($existing.Id) | Out-Null
    Write-Output "ACTIVATED: Brought existing NanoPix window (PID $($existing.Id)) to foreground."
} else {
    # Clean up any dead / windowless / zombie instances
    Stop-Process -Name NanoPix -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 200
    # Launch fresh interactive GUI window
    Start-Process -FilePath $targetExe -WorkingDirectory $workingDir -WindowStyle Normal
    Write-Output "LAUNCHED: Successfully launched Eighteeth GUI: $targetExe"
}
