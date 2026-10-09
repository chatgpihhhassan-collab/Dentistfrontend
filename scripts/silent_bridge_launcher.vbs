' Dentia NanoPix Hardware Bridge — Portable Silent Launcher v2
' ============================================================
' CRITICAL: This file must work on ANY PC regardless of install path.
' It dynamically detects its own location at runtime — NO hardcoded paths.
' DO NOT manually edit the CurrentDirectory path here.

Set WshShell = CreateObject("WScript.Shell")
Set fso     = CreateObject("Scripting.FileSystemObject")

' -------------------------------------------------------------------
' Resolve project root dynamically.
' This script lives at: <project_root>\scripts\silent_bridge_launcher.vbs
' So:  scriptsFolder = <project_root>\scripts
'      projectRoot   = <project_root>
' -------------------------------------------------------------------
Dim scriptPath, scriptsFolder, projectRoot
scriptPath    = WScript.ScriptFullName
scriptsFolder = fso.GetParentFolderName(scriptPath)
projectRoot   = fso.GetParentFolderName(scriptsFolder)

' -------------------------------------------------------------------
' Write a timestamped log entry (append, create if missing)
' -------------------------------------------------------------------
Dim logPath
logPath = projectRoot & "\dentia_bridge_log.txt"
On Error Resume Next
Dim logFile
Set logFile = fso.OpenTextFile(logPath, 8, True)  ' 8=ForAppending, True=create
logFile.WriteLine "[" & Now() & "] [LAUNCHER] Bridge triggered. Project root: " & projectRoot
logFile.Close
On Error GoTo 0

' -------------------------------------------------------------------
' Verify project bridge script exists before launching
' -------------------------------------------------------------------
Dim bridgeScript
bridgeScript = projectRoot & "\nanopix_usb_bridge.cjs"
If Not fso.FileExists(bridgeScript) Then
    On Error Resume Next
    Set logFile = fso.OpenTextFile(logPath, 8, True)
    logFile.WriteLine "[" & Now() & "] [ERROR] nanopix_usb_bridge.cjs not found at: " & bridgeScript
    logFile.WriteLine "[" & Now() & "] [ERROR] Ensure project files are present on this PC."
    logFile.Close
    On Error GoTo 0
    ' Exit silently — doctor will see "Pending" in modal
    WScript.Quit 1
End If

' -------------------------------------------------------------------
' Set working directory to project root and launch bridge silently
' 0 = hidden window, False = don't wait (non-blocking)
' -------------------------------------------------------------------
WshShell.CurrentDirectory = projectRoot
WshShell.Run "cmd.exe /c node nanopix_usb_bridge.cjs >> """ & logPath & """ 2>&1", 0, False
