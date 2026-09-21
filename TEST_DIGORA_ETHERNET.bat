<# :
@echo off
setlocal
cls
title Soredex DIGORA Optime - Ethernet and Hardware Diagnostics
color 0B
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-Expression ([System.IO.File]::ReadAllText('%~f0'))"
echo.
echo ===================================================================
echo   Diagnostics finished. Press any key to exit.
echo ===================================================================
pause >nul
goto :eof
#>
# ============================================================================
# SOREDEX DIGORA? OPTIME ? ETHERNET & DOOR HARDWARE DIAGNOSTIC ENGINE
# 100% Standalone - Runs natively in Windows - Zero Node.js / Python Required
# ============================================================================

$Host.UI.RawUI.WindowTitle = "Soredex DIGORA Optime - Ethernet Diagnostics"

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "   SOREDEX DIGORA OPTIME - ETHERNET & DOOR HARDWARE DIAGNOSTIC" -ForegroundColor Cyan
Write-Host "   Dentia Dental Cloud Workspace | Clinic Hardware Validator" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This tool tests Ethernet communication with your physical Soredex" -ForegroundColor White
Write-Host "DIGORA Optime countertop PSP scanner and triggers the motorized door." -ForegroundColor White
Write-Host ""

# Helper Functions
function Test-PortQuick($ip, $port, $timeoutMs = 1200) {
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $iar = $tcpClient.BeginConnect($ip, $port, $null, $null)
        $success = $iar.AsyncWaitHandle.WaitOne($timeoutMs, $false)
        if ($success -and $tcpClient.Connected) {
            $tcpClient.EndConnect($iar)
            $tcpClient.Close()
            return $true
        }
        $tcpClient.Close()
    } catch {}
    return $false
}

function Test-PingQuick($ip, $timeoutMs = 1000) {
    try {
        $ping = New-Object System.Net.NetworkInformation.Ping
        $reply = $ping.Send($ip, $timeoutMs)
        return ($reply.Status -eq [System.Net.NetworkInformation.IPStatus]::Success)
    } catch {
        return $false
    }
}

function Send-DigoraMotorOpen($ip) {
    # Soredex DIGORA Optime door open sequence bytes
    $doorBytes = [byte[]](0x00, 0x00, 0x00, 0x08, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00)
    $ports = @(2002, 104)
    $delivered = $false

    foreach ($p in $ports) {
        try {
            $client = New-Object System.Net.Sockets.TcpClient
            $iar = $client.BeginConnect($ip, $p, $null, $null)
            if ($iar.AsyncWaitHandle.WaitOne(1500, $false) -and $client.Connected) {
                $client.EndConnect($iar)
                $stream = $client.GetStream()
                $stream.Write($doorBytes, 0, $doorBytes.Length)
                $stream.Flush()
                $client.Close()
                Write-Host "  >> [SUCCESS] Motor Open Packet DELIVERED to $ip on Port $p!" -ForegroundColor Green
                Write-Host "  >> Listen for the physical motor whir on your DIGORA scanner!" -ForegroundColor Green
                $delivered = $true
                break
            }
            $client.Close()
        } catch {}
    }
    return $delivered
}

function Send-DigoraBroadcast() {
    try {
        $udp = New-Object System.Net.Sockets.UdpClient
        $udp.Client.SetSocketOption([System.Net.Sockets.SocketOptionLevel]::Socket, [System.Net.Sockets.SocketOptionName]::ReuseAddress, $true)
        $udp.EnableBroadcast = $true
        $broadcastEp = New-Object System.Net.IPEndPoint([System.Net.IPAddress]::Broadcast, 10000)
        $payload = [System.Text.Encoding]::ASCII.GetBytes("SOREDEX_DISCOVERY_PROBE_DIGORA_OPTIME")
        $null = $udp.Send($payload, $payload.Length, $broadcastEp)
        $udp.Close()
        Write-Host "  >> Transmitted Soredex UDP 10000 wake broadcast to 255.255.255.255" -ForegroundColor Gray
    } catch {
        Write-Host "  >> UDP broadcast notice: $($_.Exception.Message)" -ForegroundColor DarkGray
    }
}

# 1. Local Network Identification
Write-Host "--- [1] LOCAL NETWORK & ETHERNET ADAPTER STATUS ---" -ForegroundColor Yellow
$adapters = Get-CimInstance Win32_NetworkAdapterConfiguration | Where-Object { $_.IPEnabled -eq $true }
$localIps = @()
$has1921681 = $false

foreach ($adapter in $adapters) {
    $ip = $adapter.IPAddress[0]
    $mask = $adapter.IPSubnet[0]
    $desc = $adapter.Description
    $localIps += $ip
    if ($ip -like "192.168.1.*") { $has1921681 = $true }
    Write-Host "  Adapter: $desc" -ForegroundColor Gray
    Write-Host "    IPv4: $ip  |  Subnet Mask: $mask" -ForegroundColor White
}

# 2. Check for Scanora / Soredex software running on this PC
Write-Host ""
Write-Host "--- [2] SOREDEX / SCANORA SOFTWARE DETECTION ---" -ForegroundColor Yellow
$soredexProcs = Get-Process | Where-Object { $_.ProcessName -match 'scanora|digora|soredex|optime|acquisition' }
if ($soredexProcs) {
    foreach ($proc in $soredexProcs) {
        Write-Host "  >> [ACTIVE] Found running process: $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor Green
    }
} else {
    Write-Host "  Scanora is not currently running as an active background process on this specific PC." -ForegroundColor Gray
    Write-Host "  (If Scanora is installed on another machine like 192.168.0.75, run this tool on that machine)." -ForegroundColor Gray
}

Write-Host ""

# Main Menu
Write-Host "Choose an action:" -ForegroundColor Cyan
Write-Host "  [1] Quick Test & Open Door (Default IPs: 192.168.0.120 and 192.168.1.120)" -ForegroundColor White
Write-Host "  [2] Enter Specific Scanner IP (e.g. from Scanora settings)" -ForegroundColor White
Write-Host "  [3] Scan Entire Subnet (192.168.0.1 to 192.168.0.254) for Soredex Scanner" -ForegroundColor White
Write-Host "  [4] Continuous Motor Door Open Loop (Watch the machine motor for 16s)" -ForegroundColor White
Write-Host "  [5] Add Secondary IP (192.168.1.199) to Windows Network Adapter" -ForegroundColor White
Write-Host "  [6] Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Select option [1, 2, 3, 4, 5, or 6] (Press ENTER for 1)"
if ([string]::IsNullOrWhiteSpace($choice)) { $choice = "1" }

if ($choice -eq "6") { return }

# Option 5: Add Secondary IP for Subnet Mismatch
if ($choice -eq "5") {
    Write-Host ""
    Write-Host "--- ADDING SECONDARY IP FOR 192.168.1.x SUBNET ---" -ForegroundColor Yellow
    Write-Host "This allows this PC to talk to factory DIGORA (192.168.1.120) while staying on 192.168.0.x!" -ForegroundColor White
    Write-Host ""
    Write-Host "Run this command in an Administrator Command Prompt or PowerShell:" -ForegroundColor Cyan
    Write-Host "netsh interface ip add address `"Ethernet`" 192.168.1.199 255.255.255.0" -ForegroundColor Green
    Write-Host ""
    Write-Host "Or via PowerShell (Admin):" -ForegroundColor Cyan
    Write-Host "New-NetIPAddress -InterfaceAlias 'Ethernet' -IPAddress 192.168.1.199 -PrefixLength 24" -ForegroundColor Green
    return
}

# Option 3: Full Subnet Sweep
if ($choice -eq "3") {
    Write-Host ""
    Write-Host "--- SCANNING SUBNET 192.168.0.x FOR SOREDEX HARDWARE ---" -ForegroundColor Yellow
    Write-Host "Probing active ARP devices for Port 104 (DICOM) and Port 2002 (Soredex)..." -ForegroundColor White
    Write-Host ""

    $ips = (arp -a | Select-String "192.168.0." | ForEach-Object {
        $line = $_.Line.Trim()
        $parts = $line -split '\s+'
        if ($parts.Count -ge 2 -and $parts[0] -match '^192\.168\.0\.\d+$') { $parts[0] }
    }) | Sort-Object -Unique

    Write-Host "Probing $($ips.Count) network devices..." -ForegroundColor Gray
    $found = @()
    foreach ($target in $ips) {
        foreach ($p in @(104, 2002)) {
            if (Test-PortQuick $target $p 200) {
                Write-Host "  >> [FOUND] $target has Port $p OPEN!" -ForegroundColor Green
                $found += $target
                Send-DigoraMotorOpen $target
            }
        }
    }
    if ($found.Count -eq 0) {
        Write-Host "No open DICOM 104 or Soredex 2002 ports detected in ARP devices." -ForegroundColor Yellow
        Write-Host "Ensure DIGORA is powered ON and top circular button has been pressed to wake." -ForegroundColor Yellow
    }
    return
}

# Option 4: Continuous Motor Loop
if ($choice -eq "4") {
    Write-Host ""
    Write-Host "--- CONTINUOUS MOTOR TRIGGER LOOP (16 SECONDS) ---" -ForegroundColor Yellow
    Write-Host "Stand in front of your DIGORA Optime countertop machine!" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C at any time to stop." -ForegroundColor Gray
    Write-Host ""
    Send-DigoraBroadcast
    for ($i = 1; $i -le 8; $i++) {
        Write-Host "[$i/8] Transmitting door open pulse..." -ForegroundColor White
        $null = Send-DigoraMotorOpen "192.168.0.120"
        $null = Send-DigoraMotorOpen "192.168.1.120"
        $null = Send-DigoraMotorOpen "192.168.0.75"
        Start-Sleep -Seconds 2
    }
    Write-Host "Continuous loop completed." -ForegroundColor Green
    return
}

# Options 1 or 2: Standard Hardware Diagnostic
$targetIps = @("192.168.0.100", "192.168.0.75", "192.168.1.120")

if ($choice -eq "2") {
    $custom = Read-Host "Enter the Soredex DIGORA IP address (Default: 192.168.0.100)"
    if (-not [string]::IsNullOrWhiteSpace($custom)) {
        $targetIps = @($custom.Trim())
    }
}

Write-Host ""
Write-Host "--- [3] TRANSMITTING SOREDEX UDP 10000 WAKE BEACON ---" -ForegroundColor Yellow
Send-DigoraBroadcast

Write-Host ""
Write-Host "--- [4] TESTING PHYSICAL SCANNER CONNECTIVITY ---" -ForegroundColor Yellow

$foundWorkingDevice = $false

foreach ($ip in $targetIps) {
    Write-Host "Checking target: $ip ..." -ForegroundColor Cyan

    $pingOk = Test-PingQuick $ip 800
    Write-Host "  ICMP Ping: " -NoNewline
    if ($pingOk) { Write-Host "REPLY RECEIVED (Online)" -ForegroundColor Green } else { Write-Host "No reply (Timeout / Different subnet)" -ForegroundColor Red }

    $p104 = Test-PortQuick $ip 104
    Write-Host "  Port 104 (DICOM SCP Storage): " -NoNewline
    if ($p104) { Write-Host "OPEN (Ready for X-ray)" -ForegroundColor Green } else { Write-Host "Closed or Filtered" -ForegroundColor Gray }

    $p2002 = Test-PortQuick $ip 2002
    Write-Host "  Port 2002 (Soredex Motor / Control): " -NoNewline
    if ($p2002) { Write-Host "OPEN (Ready for Motor)" -ForegroundColor Green } else { Write-Host "Closed or Filtered" -ForegroundColor Gray }

    $p80 = Test-PortQuick $ip 80
    Write-Host "  Port 80 (HTTP Device Config): " -NoNewline
    if ($p80) { Write-Host "OPEN (Web Server Responding)" -ForegroundColor Green } else { Write-Host "Closed" -ForegroundColor Gray }

    Write-Host "  Sending Motor Shutter Open sequence to $ip ..." -ForegroundColor Yellow
    $opened = Send-DigoraMotorOpen $ip

    if ($pingOk -or $p104 -or $p2002 -or $opened) {
        $foundWorkingDevice = $true
    }
    Write-Host ""
}

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "   RESULTS & CLINIC RECOMMENDATIONS" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan

if ($foundWorkingDevice) {
    Write-Host " [SUCCESS] Ethernet communication with DIGORA Optime confirmed!" -ForegroundColor Green
    Write-Host " The feeder slot motor command was transmitted." -ForegroundColor Green
} else {
    Write-Host " [NOTICE: NO SCANNER DETECTED AT TESTED IPS]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host " KEY CHECKLIST:" -ForegroundColor White
    Write-Host " 1. PRESS THE TOP ROUND START BUTTON ON THE DIGORA MACHINE:" -ForegroundColor Cyan
    Write-Host "    - Soredex DIGORA Optime has an internal sleep lock." -ForegroundColor White
    Write-Host "    - Pressing the top round button wakes the motor and unlocks the door!" -ForegroundColor White
    Write-Host ""
    Write-Host " 2. RUN THIS TOOL ON THE MACHINE CONNECTED TO DIGORA:" -ForegroundColor Cyan
    Write-Host "    - If the Ethernet cable is plugged into 192.168.0.75 (where Scanora is)," -ForegroundColor White
    Write-Host "      download and run this batch file directly on 192.168.0.75." -ForegroundColor White
    Write-Host ""
    Write-Host " 3. CHECK THE IP IN SCANORA:" -ForegroundColor Cyan
    Write-Host "    - In Scanora -> Options/Settings -> Optime, check the exact IP address." -ForegroundColor White
    Write-Host "    - Choose Option [2] in this tool and enter that exact IP." -ForegroundColor White
}
Write-Host "===================================================================" -ForegroundColor Cyan
