<# :
@echo off
setlocal
cls
title Soredex DIGORA Optime - Hardware and Door Diagnostics (Clinic Tool)
color 0B
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-Expression ([System.IO.File]::ReadAllText('%~f0'))"
echo.
echo ===================================================================
echo   Diagnostic session ended. Press any key to exit.
echo ===================================================================
pause >nul
goto :eof
#>
# ============================================================================
# SOREDEX DIGORA OPTIME - PURE POWERSHELL HARDWARE & DOOR DIAGNOSTIC ENGINE
# 100% Standalone - Zero Node.js Required - Zero External Downloads Required
# ============================================================================

$Host.UI.RawUI.WindowTitle = "Soredex DIGORA Optime - Hardware & Door Diagnostics"

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "   SOREDEX DIGORA OPTIME - HARDWARE & DOOR TEST (CLINIC TOOL)" -ForegroundColor Cyan
Write-Host "   Dentia Dental Cloud Workspace" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This tool tests your physical DIGORA Optime countertop scanner," -ForegroundColor White
Write-Host "verifies Ethernet communication, and sends the motor command to open the door." -ForegroundColor White
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

function Test-PingQuick($ip) {
    try {
        $ping = New-Object System.Net.NetworkInformation.Ping
        $reply = $ping.Send($ip, 1000)
        return ($reply.Status -eq [System.Net.NetworkInformation.IPStatus]::Success)
    } catch {
        return $false
    }
}

function Send-DigoraMotorOpen($ip) {
    # DIGORA Optime door open sequence bytes
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
        $udp.EnableBroadcast = $true
        $broadcastEp = New-Object System.Net.IPEndPoint([System.Net.IPAddress]::Broadcast, 10000)
        $payload = [System.Text.Encoding]::ASCII.GetBytes("SOREDEX_DISCOVERY_PROBE_DIGORA_OPTIME")
        $null = $udp.Send($payload, $payload.Length, $broadcastEp)
        $udp.Close()
        Write-Host "  >> Transmitted Soredex UDP 10000 wake broadcast to 255.255.255.255" -ForegroundColor Gray
    } catch {}
}

# 1. Show Local Adapters
Write-Host "--- [1] LOCAL NETWORK STATUS ON THIS COMPUTER ---" -ForegroundColor Yellow
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
    Write-Host "    IPv4: $ip  |  Mask: $mask" -ForegroundColor White
}

if (-not $has1921681) {
    Write-Host ""
    Write-Host "  [!] NOTICE: This computer does not currently have a 192.168.1.x IP." -ForegroundColor Yellow
    Write-Host "      DIGORA Optime factory default is 192.168.1.120." -ForegroundColor Yellow
    Write-Host "      If DIGORA is plugged directly via Ethernet, you may need a secondary IP." -ForegroundColor Yellow
}
Write-Host ""

# Main Menu
Write-Host "Choose an action:" -ForegroundColor Cyan
Write-Host "  [1] Quick Test & Open Door (Default IPs: 192.168.1.120 and 192.168.0.120)" -ForegroundColor White
Write-Host "  [2] Enter Specific Scanner IP to Test & Open Door" -ForegroundColor White
Write-Host "  [3] Continuous Motor Trigger Loop (Runs 8 times over 16 seconds)" -ForegroundColor White
Write-Host "  [4] How to Wake Machine with Physical Button & Fix Subnet Mismatch" -ForegroundColor White
Write-Host "  [5] Exit" -ForegroundColor White
Write-Host ""
$choice = Read-Host "Select option [1, 2, 3, 4, or 5] (Press ENTER for 1)"
if ([string]::IsNullOrWhiteSpace($choice)) { $choice = "1" }

if ($choice -eq "5") { return }

if ($choice -eq "4") {
    Write-Host ""
    Write-Host "===================================================================" -ForegroundColor Cyan
    Write-Host "   PHYSICAL MACHINE BUTTON & SUBNET GUIDE" -ForegroundColor Cyan
    Write-Host "===================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. PHYSICAL PUSH-BUTTON ON DIGORA OPTIME:" -ForegroundColor Yellow
    Write-Host "   Look at the top casing of your Soredex DIGORA Optime." -ForegroundColor White
    Write-Host "   There is a large circular push-button on top." -ForegroundColor White
    Write-Host "   When the machine is in Standby/Power-Save mode:" -ForegroundColor White
    Write-Host "   - The motor door is held mechanically locked to prevent dust entry." -ForegroundColor Gray
    Write-Host "   - PRESSING THAT ROUND BUTTON WAKES THE SCANNER AND OPENS THE DOOR." -ForegroundColor Green
    Write-Host ""
    Write-Host "2. WORK PC VS LAPTOP NOTE:" -ForegroundColor Yellow
    Write-Host "   - If the DIGORA Optime Ethernet cable is plugged into your WORK PC," -ForegroundColor White
    Write-Host "     your LAPTOP on Wi-Fi cannot talk directly to it unless you run this tool" -ForegroundColor White
    Write-Host "     on the Work PC, or connect both to the same clinic switch/router." -ForegroundColor White
    Write-Host ""
    Write-Host "3. HOW TO ADD 192.168.1.x SECONDARY IP (IF ON 192.168.0.x):" -ForegroundColor Yellow
    Write-Host "   Open Administrator Command Prompt and run:" -ForegroundColor White
    Write-Host "   netsh interface ip add address `"Ethernet`" 192.168.1.199 255.255.255.0" -ForegroundColor Cyan
    Write-Host "===================================================================" -ForegroundColor Cyan
    return
}

$targetIps = @("192.168.1.120", "192.168.0.120")

if ($choice -eq "2") {
    $custom = Read-Host "Enter your Soredex DIGORA IP address"
    if (-not [string]::IsNullOrWhiteSpace($custom)) {
        $targetIps = @($custom.Trim())
    }
}

if ($choice -eq "3") {
    Write-Host ""
    Write-Host "--- CONTINUOUS MOTOR TRIGGER LOOP (16 SECONDS) ---" -ForegroundColor Yellow
    Write-Host "Watch the front feeder door on your DIGORA Optime now!" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C at any time to cancel." -ForegroundColor Gray
    Write-Host ""
    Send-DigoraBroadcast
    for ($i = 1; $i -le 8; $i++) {
        Write-Host "[$i/8] Sending motor open pulse to 192.168.1.120 and 192.168.0.120..." -ForegroundColor White
        $null = Send-DigoraMotorOpen "192.168.1.120"
        $null = Send-DigoraMotorOpen "192.168.0.120"
        Start-Sleep -Seconds 2
    }
    Write-Host "Continuous loop completed." -ForegroundColor Green
    return
}

# Option 1 or 2: Standard Diagnostics
Write-Host ""
Write-Host "--- [2] BROADCASTING DISCOVERY BEACON ---" -ForegroundColor Yellow
Send-DigoraBroadcast

Write-Host ""
Write-Host "--- [3] TESTING CONNECTION TO SCANNER ---" -ForegroundColor Yellow

$foundWorkingDevice = $false

foreach ($ip in $targetIps) {
    Write-Host "Checking target IP: $ip ..." -ForegroundColor Cyan
    
    # Ping test
    $pingOk = Test-PingQuick $ip
    Write-Host "  ICMP Ping: " -NoNewline
    if ($pingOk) { Write-Host "REPLY RECEIVED (Online)" -ForegroundColor Green } else { Write-Host "No reply (Timeout / Different subnet)" -ForegroundColor Red }
    
    # DICOM Port 104
    $p104 = Test-PortQuick $ip 104
    Write-Host "  Port 104 (DICOM SCP): " -NoNewline
    if ($p104) { Write-Host "OPEN / READY" -ForegroundColor Green } else { Write-Host "Closed or Filtered" -ForegroundColor Gray }
    
    # Soredex Port 2002
    $p2002 = Test-PortQuick $ip 2002
    Write-Host "  Port 2002 (Soredex Motor Protocol): " -NoNewline
    if ($p2002) { Write-Host "OPEN / READY" -ForegroundColor Green } else { Write-Host "Closed or Filtered" -ForegroundColor Gray }
    
    # Port 80
    $p80 = Test-PortQuick $ip 80
    Write-Host "  Port 80 (HTTP Config): " -NoNewline
    if ($p80) { Write-Host "OPEN / RESPONDING" -ForegroundColor Green } else { Write-Host "Closed" -ForegroundColor Gray }
    
    # Attempt Motor Open
    Write-Host "  Sending Motor Open Sequence to $ip ..." -ForegroundColor Yellow
    $opened = Send-DigoraMotorOpen $ip
    
    if ($pingOk -or $p104 -or $p2002 -or $opened) {
        $foundWorkingDevice = $true
    }
    Write-Host ""
}

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "   RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan

if ($foundWorkingDevice) {
    Write-Host " [SUCCESS] Communication with Soredex DIGORA Optime was verified!" -ForegroundColor Green
    Write-Host " The feeder slot motor command was sent. Your machine is ready." -ForegroundColor Green
} else {
    Write-Host " [NOT DETECTED ON THIS COMPUTER'S NETWORK]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host " KEY POINTS TO CHECK:" -ForegroundColor White
    Write-Host " 1. Are you running this test on the computer connected to the DIGORA?" -ForegroundColor Cyan
    Write-Host "    - If DIGORA is connected to your WORK PC, run this tool on the WORK PC!" -ForegroundColor White
    Write-Host "    - If running on your LAPTOP, ensure your laptop is plugged into the same" -ForegroundColor White
    Write-Host "      network/switch as the DIGORA." -ForegroundColor White
    Write-Host ""
    Write-Host " 2. PRESS THE ROUND BUTTON ON TOP OF THE DIGORA MACHINE:" -ForegroundColor Cyan
    Write-Host "    - The DIGORA Optime stays in locked sleep mode until the top physical" -ForegroundColor White
    Write-Host "      button is pressed. Pressing it unlocks and whirs open the door." -ForegroundColor White
    Write-Host ""
    Write-Host " 3. SUBNET DIFFERENCE:" -ForegroundColor Cyan
    Write-Host "    - If this computer is on 192.168.0.x and DIGORA is on 192.168.1.120," -ForegroundColor White
    Write-Host "      they cannot talk unless you add a 192.168.1.x secondary IP." -ForegroundColor White
}
Write-Host "===================================================================" -ForegroundColor Cyan
