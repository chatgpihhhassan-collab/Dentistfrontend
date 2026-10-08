# Dentia Local Hardware Agent - Task Scheduler Uninstaller
$taskName = "DentiaLocalAgent"

Write-Host "Removing Dentia Scheduled Task ($taskName)..." -ForegroundColor Yellow
try {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "✅ Scheduled Task '$taskName' removed." -ForegroundColor Green
} catch {
    Write-Host "Task was not found or already removed." -ForegroundColor Gray
}

# Stop any running agent on port 5055
try {
    $port5055Pid = (Get-NetTCPConnection -LocalPort 5055 -ErrorAction SilentlyContinue).OwningProcess
    if ($port5055Pid) {
        Stop-Process -Id $port5055Pid -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Stopped agent process (PID: $port5055Pid)." -ForegroundColor Green
    }
} catch {}
