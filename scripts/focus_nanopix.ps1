Add-Type @"
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public class WindowFocuser {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    public static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool BringWindowToTop(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern void SwitchToThisWindow(IntPtr hWnd, bool fUnknown);

    [DllImport("kernel32.dll")]
    public static extern uint GetCurrentThreadId();

    public static void FocusNanoPixWindows(uint targetPid) {
        IntPtr fgWnd = GetForegroundWindow();
        uint fgPid;
        uint fgThread = GetWindowThreadProcessId(fgWnd, out fgPid);
        uint curThread = GetCurrentThreadId();

        if (fgThread != curThread) {
            AttachThreadInput(curThread, fgThread, true);
        }

        EnumWindows((hWnd, lParam) => {
            uint procId;
            uint winThread = GetWindowThreadProcessId(hWnd, out procId);
            if (procId == targetPid) {
                var sbClass = new StringBuilder(256);
                GetClassName(hWnd, sbClass, 256);
                string cls = sbClass.ToString();

                // Focus main GLFW and top-level windows
                if (cls.Contains("GLFW") || cls.Contains("NanoPix") || cls.Length > 0) {
                    ShowWindowAsync(hWnd, 9); // SW_RESTORE
                    ShowWindowAsync(hWnd, 5); // SW_SHOW
                    ShowWindow(hWnd, 9);
                    ShowWindow(hWnd, 5);
                    BringWindowToTop(hWnd);
                    SetForegroundWindow(hWnd);
                    SwitchToThisWindow(hWnd, true);
                }
            }
            return true;
        }, IntPtr.Zero);

        if (fgThread != curThread) {
            AttachThreadInput(curThread, fgThread, false);
        }
    }
}
"@

$procs = Get-Process -Name NanoPix -ErrorAction SilentlyContinue
foreach ($p in $procs) {
    Write-Host "Focusing NanoPix PID:" $p.Id
    [WindowFocuser]::FocusNanoPixWindows($p.Id)
}
