$Output = @{}

# 1. Processes
$processes = Get-Process | Where-Object { $_.Name -match "NanoPix|nanopick|launch|eighteeth" -or $_.Path -match "NanoPix|nanopick|eighteeth" } | Select-Object Name, Id, Path, CommandLine, MainWindowTitle
$Output.Processes = $processes

# 2. Services
$services = Get-Service | Where-Object { $_.Name -match "NanoPix|nanopick|eighteeth" -or $_.DisplayName -match "NanoPix|nanopick|eighteeth" } | Select-Object Name, DisplayName, Status, StartType
$Output.Services = $services

# 3. Registry - Uninstall keys for installation directory and version
$uninstallPaths = @(
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
    "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall",
    "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"
)
$installations = @()
foreach ($path in $uninstallPaths) {
    if (Test-Path $path) {
        $keys = Get-ChildItem -Path $path
        foreach ($key in $keys) {
            $prop = Get-ItemProperty -Path $key.PSPath
            if ($prop.DisplayName -match "NanoPix|NanoPick|Eighteeth") {
                $installations += @{
                    DisplayName = $prop.DisplayName
                    DisplayVersion = $prop.DisplayVersion
                    InstallLocation = $prop.InstallLocation
                    Publisher = $prop.Publisher
                }
            }
        }
    }
}
$Output.Installations = $installations

# 4. USB Devices (VID/PID: 0403:6014 was mentioned in telemetry, and general NanoPix)
$usbDevices = Get-WmiObject Win32_PnPEntity | Where-Object { $_.Name -match "NanoPix|NanoPick|Eighteeth|FTDI|FT232H" -or $_.DeviceID -match "VID_0403&PID_6014" } | Select-Object Name, DeviceID, Manufacturer, Description, Status
$Output.USBDevices = $usbDevices

# 5. Startup Entries
$startupPaths = @(
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run",
    "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Run",
    "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run"
)
$startups = @()
foreach ($path in $startupPaths) {
    if (Test-Path $path) {
        $props = Get-ItemProperty -Path $path
        foreach ($prop in $props.PSObject.Properties) {
            if ($prop.Value -match "NanoPix|NanoPick|eighteeth") {
                $startups += @{
                    Name = $prop.Name
                    Value = $prop.Value
                    Location = $path
                }
            }
        }
    }
}
$Output.StartupEntries = $startups

# Save to JSON
$Output | ConvertTo-Json -Depth 5 | Out-File -FilePath "D:\dentistfrontend\Dentistfrontend\nanopix_discovery.json" -Encoding utf8
