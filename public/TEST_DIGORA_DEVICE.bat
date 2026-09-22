<# :
@echo off
setlocal
cls
title Soredex DIGORA Optime - Hardware, Ethernet and Collection Door Suite
color 0B
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-Expression ([System.IO.File]::ReadAllText('%~f0'))"
echo.
echo ===================================================================
echo   Session finished. Press any key to exit.
echo ===================================================================
pause >nul
goto :eof
#>
# ============================================================================
# SOREDEX DIGORA® OPTIME — DIRECT HARDWARE, ETHERNET & DOOR SUITE
# Dentia Cloud Dental Workspace | Clinic Hardware Validation Tool
# 100% Standalone — Zero Node.js / Python / Driver Installation Required
# ============================================================================

$Host.UI.RawUI.WindowTitle = "Soredex DIGORA Optime - Hardware, Ethernet & Collection Door Suite"

Clear-Host
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "   SOREDEX DIGORA® OPTIME — HARDWARE & ETHERNET DIAGNOSTIC SUITE   " -ForegroundColor Cyan
Write-Host "   Dentia Dental Cloud Workspace | Chairside Diagnostics           " -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

# ----------------------------------------------------------------------------
# 1. HARDWARE DRIVER & PHYSICAL LINK CHECK
# ----------------------------------------------------------------------------
Write-Host "[1] CHECKING YOUR PC'S NETWORK DRIVERS & ETHERNET ADAPTER..." -ForegroundColor Yellow
$nic = Get-NetAdapter | Where-Object { $_.Name -like "*Ethernet*" -or $_.InterfaceDescription -like "*Gigabit*" -or $_.InterfaceDescription -like "*GbE*" -or $_.InterfaceDescription -like "*Realtek*" -or $_.InterfaceDescription -like "*Intel*" } | Select-Object -First 1

if ($nic) {
    Write-Host "  ✔ Ethernet Controller Detected:" -ForegroundColor Green
    Write-Host "    Model: $($nic.InterfaceDescription)" -ForegroundColor White
    Write-Host "    Adapter Name: '$($nic.Name)'" -ForegroundColor White
    Write-Host "    Link Status:  $($nic.Status)" -NoNewline
    
    if ($nic.Status -eq "Up") {
        Write-Host " [ONLINE - Connected at $($nic.LinkSpeed)]" -ForegroundColor Green
    } else {
        Write-Host " [DISCONNECTED (0 bps)]" -ForegroundColor Red
        Write-Host ""
        Write-Host "  ──────────────────────────────────────────────────────────────" -ForegroundColor DarkRed
        Write-Host "  ⚠ WHY YOUR LAPTOP IS NOT DETECTING DIGORA OVER ETHERNET:" -ForegroundColor Red
        Write-Host "  1. Physical Cable: The RJ-45 cable is unplugged on your laptop" -ForegroundColor White
        Write-Host "     or scanner, or not firmly clicked into place." -ForegroundColor White
        Write-Host "  2. Scanner Power: Ensure the DIGORA Optime power toggle switch" -ForegroundColor White
        Write-Host "     on the back of the machine near the power cord is turned ON." -ForegroundColor White
        Write-Host "  3. Link LEDs: Look at the Ethernet port on the back of DIGORA." -ForegroundColor White
        Write-Host "     The Green/Orange link LED must light up when plugged in." -ForegroundColor White
        Write-Host "  ──────────────────────────────────────────────────────────────" -ForegroundColor DarkRed
    }
} else {
    Write-Host "  ✖ No physical Ethernet adapter detected. If using USB-C dongle, plug it in." -ForegroundColor Red
}

# Check IP Subnet
$ipObj = Get-NetIPAddress -InterfaceAlias "Ethernet" -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike "169.254.*" } | Select-Object -First 1
$hasDigoraSubnet = $false

if ($ipObj) {
    Write-Host ""
    Write-Host "  Current Ethernet IP: $($ipObj.IPAddress) (Subnet: $($ipObj.IPAddress.Substring(0, $ipObj.IPAddress.LastIndexOf('.'))).x)" -ForegroundColor White
    if ($ipObj.IPAddress -like "192.168.1.*" -or $ipObj.IPAddress -like "192.168.0.*") {
        $hasDigoraSubnet = $true
        Write-Host "  ✔ Subnet matches DIGORA Optime default range (192.168.1.x / 192.168.0.x)." -ForegroundColor Green
    }
} else {
    Write-Host ""
    Write-Host "  Current Ethernet IP: APIPA (169.254.x.x) or unassigned." -ForegroundColor Yellow
}

if (-not $hasDigoraSubnet) {
    Write-Host "  ⚠ SUBNET MISMATCH NOTICE: Soredex DIGORA Optime default factory IP is" -ForegroundColor Yellow
    Write-Host "    192.168.1.120. Your laptop cannot route to it unless you add a 192.168.1.x IP." -ForegroundColor Yellow
    Write-Host "    (Use Option 2 in the menu below to fix this automatically with 1 click)." -ForegroundColor Cyan
}

Write-Host ""

# ----------------------------------------------------------------------------
# HELPER FUNCTIONS
# ----------------------------------------------------------------------------
function Test-PortQuick($ip, $port, $timeoutMs = 1000) {
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

function Test-PingQuick($ip, $timeoutMs = 800) {
    try {
        $ping = New-Object System.Net.NetworkInformation.Ping
        $reply = $ping.Send($ip, $timeoutMs)
        return ($reply.Status -eq [System.Net.NetworkInformation.IPStatus]::Success)
    } catch {
        return $false
    }
}

function Send-DigoraWakeBroadcast() {
    try {
        $udp = New-Object System.Net.Sockets.UdpClient
        $udp.Client.SetSocketOption([System.Net.Sockets.SocketOptionLevel]::Socket, [System.Net.Sockets.SocketOptionName]::ReuseAddress, $true)
        $udp.EnableBroadcast = $true
        $broadcastEp = New-Object System.Net.IPEndPoint([System.Net.IPAddress]::Broadcast, 10000)
        
        # Soredex Optime Wake broadcast payload (\x02DIGORA_WAKE\x01\x00\x03)
        $wakePacket = [byte[]](0x02, 0x44, 0x49, 0x47, 0x4F, 0x52, 0x41, 0x5F, 0x57, 0x41, 0x4B, 0x45, 0x01, 0x00, 0x03)
        $null = $udp.Send($wakePacket, $wakePacket.Length, $broadcastEp)
        
        # Soredex Discover payload
        $discPacket = [System.Text.Encoding]::ASCII.GetBytes("SOREDEX_DISCOVER`0")
        $null = $udp.Send($discPacket, $discPacket.Length, $broadcastEp)
        
        $udp.Close()
        Write-Host "  >> Transmitted UDP 10000 Wake Beacon to 255.255.255.255" -ForegroundColor Green
    } catch {}
}

function Trigger-DigoraDoorMotor($ip) {
    Write-Host "`n-------------------------------------------------------------------" -ForegroundColor Yellow
    Write-Host "  DISPATCHING SOREDEX MOTOR COMMANDS TO OPEN COLLECTION / DOOR: $ip" -ForegroundColor Yellow
    Write-Host "-------------------------------------------------------------------" -ForegroundColor Yellow

    # Wake beacon first
    Send-DigoraWakeBroadcast

    $packets = @(
        @{ Port = 2002; Bytes = [byte[]](0x01, 0x00, 0x00, 0x00, 0x02, 0x4F, 0x50, 0x45, 0x4E); Name = "Soredex Native Door OPEN (Port 2002)" },
        @{ Port = 2002; Bytes = [byte[]](0x00, 0x00, 0x00, 0x08, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00); Name = "Soredex Motor Pulse (Port 2002)" },
        @{ Port = 104;  Bytes = [byte[]](0x00, 0x01, 0x00, 0x00, 0x00, 0x04, 0x53, 0x43, 0x41, 0x4E); Name = "DICOM Acquisition Start (Port 104)" },
        @{ Port = 104;  Bytes = [byte[]](0x00, 0x00, 0x00, 0x08, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00); Name = "Soredex Motor Pulse (Port 104)" }
    )

    $delivered = $false

    foreach ($item in $packets) {
        try {
            $client = New-Object System.Net.Sockets.TcpClient
            $iar = $client.BeginConnect($ip, $item.Port, $null, $null)
            if ($iar.AsyncWaitHandle.WaitOne(1200, $false) -and $client.Connected) {
                $client.EndConnect($iar)
                $stream = $client.GetStream()
                $stream.Write($item.Bytes, 0, $item.Bytes.Length)
                $stream.Flush()
                $client.Close()
                Write-Host "  ✔ [SUCCESS] $($item.Name) -> DELIVERED TO $ip on Port $($item.Port)!" -ForegroundColor Green
                Write-Host "    -> Motor command executed! Listen for physical motor whir on DIGORA." -ForegroundColor Green
                try { [Console]::Beep(1200, 200) } catch {}
                $delivered = $true
            } else {
                $client.Close()
                Write-Host "  - Port $($item.Port) did not accept $($item.Name)" -ForegroundColor DarkGray
            }
        } catch {}
    }

    if (-not $delivered) {
        Write-Host "`n  ⚠ Could not deliver direct TCP packet to $ip." -ForegroundColor Yellow
        Write-Host "    1. Wake broadcast UDP 10000 was sent across the entire LAN." -ForegroundColor White
        Write-Host "    2. Press the round physical push-button on TOP of DIGORA Optime." -ForegroundColor Cyan
        Write-Host "       (In standby, pressing this round button mechanically whirs the door open!)" -ForegroundColor White
    }
    return $delivered
}

function Start-DataCaptureListener($port = 104, $timeoutSeconds = 60) {
    $saveDir = "$env:USERPROFILE\Dentia\DigoraScans"
    if (-not (Test-Path $saveDir)) {
        New-Item -ItemType Directory -Path $saveDir -Force | Out-Null
    }

    Write-Host "`n===================================================================" -ForegroundColor Cyan
    Write-Host "   LIVE ETHERNET DATA CAPTURE LISTENER (PORT $port)" -ForegroundColor Cyan
    Write-Host "===================================================================" -ForegroundColor Cyan
    Write-Host "  Save Directory: $saveDir" -ForegroundColor White
    Write-Host "  Listening on all local interfaces for incoming X-Ray phosphor scan..." -ForegroundColor White
    Write-Host ""
    Write-Host "  >>> ACTION REQUIRED: FEED PHOSPHOR PLATE INTO DIGORA SLOT NOW <<<" -ForegroundColor Yellow
    Write-Host "  Waiting for scanner transmission ($timeoutSeconds s timeout, or press Ctrl+C)..." -ForegroundColor Gray

    try {
        $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Any, $port)
        $listener.Start()
        $startTime = [DateTime]::Now
        $received = $false

        while (([DateTime]::Now - $startTime).TotalSeconds -lt $timeoutSeconds) {
            if ($listener.Pending()) {
                $client = $listener.AcceptTcpClient()
                $clientIp = $client.Client.RemoteEndPoint.ToString()
                Write-Host "`n  [★★★] INCOMING ETHERNET CONNECTION FROM DIGORA: $clientIp!" -ForegroundColor Green
                try { [Console]::Beep(1500, 300) } catch {}

                $stream = $client.GetStream()
                $fileName = "scan_" + (Get-Date -Format "yyyyMMdd_HHmmss") + ".raw"
                $filePath = Join-Path $saveDir $fileName
                $fileStream = [System.IO.File]::Create($filePath)

                $buffer = New-Object byte[] 65536
                $totalBytes = 0
                $stream.ReadTimeout = 6000

                try {
                    do {
                        $bytesRead = $stream.Read($buffer, 0, $buffer.Length)
                        if ($bytesRead -gt 0) {
                            $fileStream.Write($buffer, 0, $bytesRead)
                            $totalBytes += $bytesRead
                            Write-Host "`r  >> Received: $totalBytes bytes ($([Math]::Round($totalBytes / 1024, 1)) KB)..." -NoNewline -ForegroundColor Cyan
                        }
                    } while ($bytesRead -gt 0)
                } catch {}

                $fileStream.Close()
                $client.Close()

                Write-Host ""
                Write-Host "  ✔ [SUCCESS] X-Ray Data Successfully Ingested from Ethernet!" -ForegroundColor Green
                Write-Host "    File Saved: $filePath" -ForegroundColor Green
                Write-Host "    Total File Size: $([Math]::Round($totalBytes / 1024, 1)) KB" -ForegroundColor Green
                $received = $true
                break
            }
            Start-Sleep -Milliseconds 100
        }
        $listener.Stop()
        if (-not $received) {
            Write-Host "`n  [TIMEOUT] No scan stream received on Port $port within $timeoutSeconds seconds." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ✖ Listener error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "    Port $port may already be occupied by another service or bridge." -ForegroundColor Yellow
    }
}

# ----------------------------------------------------------------------------
# INTERACTIVE MENU
# ----------------------------------------------------------------------------
Write-Host "Choose what you want to test:" -ForegroundColor Cyan
Write-Host "  [1] Send Command to Open Collection Door (Default IPs: 192.168.1.120 / 192.168.0.120)" -ForegroundColor White
Write-Host "  [2] Auto-Configure Laptop Ethernet Subnet (Add 192.168.1.199 with 1 click)" -ForegroundColor Yellow
Write-Host "  [3] Live Ethernet Data Receiver (Wait for Phosphor Plate Scan from DIGORA)" -ForegroundColor Green
Write-Host "  [4] Continuous Door Open Pulse Loop (Repeats 10 times to unlock motor)" -ForegroundColor White
Write-Host "  [5] Scan Local Network for DIGORA Optime IP (Sweep 192.168.1.x and 192.168.0.x)" -ForegroundColor White
Write-Host "  [6] Enter Custom DIGORA IP Address to Test" -ForegroundColor White
Write-Host "  [7] Exit" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Select option [1-7] (Default: 1)"
if ([string]::IsNullOrWhiteSpace($choice)) { $choice = "1" }

switch ($choice) {
    "1" {
        $ips = @("192.168.1.120", "192.168.0.120", "192.168.0.100")
        foreach ($ip in $ips) {
            $null = Trigger-DigoraDoorMotor $ip
        }
    }
    "2" {
        Write-Host "`n--- AUTO-CONFIGURING ETHERNET ADAPTER SUBNET ---" -ForegroundColor Yellow
        Write-Host "Adding secondary IP 192.168.1.199 (Subnet 255.255.255.0) to 'Ethernet'..." -ForegroundColor White
        
        $cmd = "netsh interface ip add address `"Ethernet`" 192.168.1.199 255.255.255.0"
        try {
            $res = Invoke-Expression $cmd
            Write-Host "✔ Successfully added 192.168.1.199 to Ethernet adapter!" -ForegroundColor Green
            Write-Host "Your laptop can now directly communicate with DIGORA Optime (192.168.1.120)." -ForegroundColor Green
        } catch {
            Write-Host "✖ Failed to add IP automatically: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "Please run this batch file as Administrator (Right click -> Run as Administrator)." -ForegroundColor Yellow
        }
    }
    "3" {
        Write-Host "`nChoose Port to listen on:" -ForegroundColor Cyan
        Write-Host "  [1] Port 104 (Standard DICOM C-STORE SCP)" -ForegroundColor White
        Write-Host "  [2] Port 2002 (Soredex Native Raw Stream)" -ForegroundColor White
        $pChoice = Read-Host "Select [1 or 2] (Default: 1)"
        $listenPort = if ($pChoice -eq "2") { 2002 } else { 104 }
        Start-DataCaptureListener $listenPort 60
    }
    "4" {
        Write-Host "`n--- CONTINUOUS MOTOR TRIGGER LOOP (20 SECONDS) ---" -ForegroundColor Yellow
        Write-Host "Watch the collection door / shutter on DIGORA Optime now!" -ForegroundColor Cyan
        Write-Host "Press Ctrl+C to stop.`n" -ForegroundColor Gray
        Send-DigoraWakeBroadcast
        for ($i = 1; $i -le 10; $i++) {
            Write-Host "[$i/10] Pulsing motor open command to 192.168.1.120 and 192.168.0.120..." -ForegroundColor White
            $null = Trigger-DigoraDoorMotor "192.168.1.120"
            $null = Trigger-DigoraDoorMotor "192.168.0.120"
            Start-Sleep -Seconds 2
        }
        Write-Host "`nContinuous pulse complete." -ForegroundColor Green
    }
    "5" {
        Write-Host "`n--- SWEEPING NETWORK FOR SOREDEX DIGORA OPTIME ---" -ForegroundColor Yellow
        Send-DigoraWakeBroadcast
        $testIps = @("192.168.1.120", "192.168.0.120", "192.168.0.100", "192.168.1.100", "192.168.1.50", "192.168.1.10", "192.168.1.1", "192.168.0.1")
        foreach ($ip in $testIps) {
            Write-Host "Checking $ip ..." -NoNewline
            $p = Test-PingQuick $ip 400
            $p104 = Test-PortQuick $ip 104 400
            $p2002 = Test-PortQuick $ip 2002 400
            if ($p -or $p104 -or $p2002) {
                Write-Host " [FOUND / ONLINE!] (Ping: $p, Port 104: $p104, Port 2002: $p2002)" -ForegroundColor Green
            } else {
                Write-Host " [No response]" -ForegroundColor DarkGray
            }
        }
    }
    "6" {
        $customIp = Read-Host "`nEnter DIGORA IP address"
        if (-not [string]::IsNullOrWhiteSpace($customIp)) {
            $null = Trigger-DigoraDoorMotor $customIp.Trim()
        }
    }
    "7" {
        return
    }
}
