Add-Type @"
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public class WindowInspector {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool BringWindowToTop(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    public static List<string> FindWindowsForProcess(uint targetPid, bool forceShow) {
        var results = new List<string>();
        EnumWindows((hWnd, lParam) => {
            uint procId;
            GetWindowThreadProcessId(hWnd, out procId);
            if (procId == targetPid) {
                var sbTitle = new StringBuilder(256);
                GetWindowText(hWnd, sbTitle, 256);
                var sbClass = new StringBuilder(256);
                GetClassName(hWnd, sbClass, 256);
                bool visible = IsWindowVisible(hWnd);
                RECT rect;
                GetWindowRect(hWnd, out rect);

                string info = string.Format("HWND: 0x{0:X}, Title: '{1}', Class: '{2}', Visible: {3}, Rect: [{4},{5} -> {6},{7} ({8}x{9})]",
                    hWnd.ToInt64(), sbTitle.ToString(), sbClass.ToString(), visible, rect.Left, rect.Top, rect.Right, rect.Bottom, rect.Right - rect.Left, rect.Bottom - rect.Top);
                results.Add(info);

                if (forceShow) {
                    ShowWindow(hWnd, 9); // SW_RESTORE
                    ShowWindow(hWnd, 5); // SW_SHOW
                    SetForegroundWindow(hWnd);
                    BringWindowToTop(hWnd);
                }
            }
            return true;
        }, IntPtr.Zero);
        return results;
    }
}
"@

$procs = Get-Process -Name NanoPix, Launch -ErrorAction SilentlyContinue
if (-not $procs) {
    Write-Host "No NanoPix or Launch processes running."
} else {
    foreach ($p in $procs) {
        Write-Host "=========================================================="
        Write-Host "PID:" $p.Id "Name:" $p.ProcessName "SessionId:" $p.SessionId "Handle:" $p.MainWindowHandle "Title:" $p.MainWindowTitle "Path:" $p.Path
        $wins = [WindowInspector]::FindWindowsForProcess($p.Id, $true)
        if ($wins.Count -eq 0) {
            Write-Host "  [!] No HWND windows found for PID" $p.Id
        } else {
            foreach ($w in $wins) {
                Write-Host "  -> " $w
            }
        }
    }
}
