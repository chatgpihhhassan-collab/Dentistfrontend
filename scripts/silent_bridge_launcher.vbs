Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "D:\dentistfrontend\Dentistfrontend"
WshShell.Run "cmd.exe /c node nanopix_usb_bridge.cjs", 0, False
