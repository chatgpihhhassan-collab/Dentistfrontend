# Dentia Eighteeth NanoPix Desktop UI Launch & Resolution Guide

## 1. Executive Summary & Root Cause Analysis

### Masla (The Problem):
- Backend launch API `{"ok": true, "message": "NanoPix.exe launched successfully in desktop session"}` return karti thi, lekin screen par `NanoPix.exe` ka graphical user interface (UI) window samne nahi aata tha.

### Asal Wajah (Root Causes Resolved):
1. **Background Service Isolation**: Node.js jab background process/daemon ke taur par chalta hai, to `cmd.exe /c start` command parent environment ke non-interactive flags inherit kar leti thi, jiski wajah se GUI window user ke interactive desktop station (`winsta0\default`) par render nahi ho pa rahi thi.
2. **GLFW / OpenGL Window vs Win32 MainWindowHandle**: `NanoPix.exe` (v1.1.1.9) Dear ImGui aur GLFW30 OpenGL library use karta hai. Standard Windows `.NET Process.MainWindowHandle` property GLFW windows ke liye `0` return karti hai. Iski wajah se purana focus script window ko foreground par nahi la raha tha aur window Chrome/Edge browser ke peeche chupi rehti thi.
3. **Stuck Process Mutex Lock**: Agar pehle se koi background instance bina window ke phansa ho, to nayi instance mutex lock dekh kar window banaye baghair band ho jati thi.

---

## 2. Permanent Fixes Implemented

### 1. Windows Explorer Desktop Shell Launching (`explorer.exe`)
- [`agent/server.js`](file:///d:/dentistfrontend/Dentistfrontend/agent/server.js) aur [`launch_engine_util.cjs`](file:///d:/dentistfrontend/Dentistfrontend/launch_engine_util.cjs) mein spawn mechanism ko Windows Explorer Shell se route kar diya gaya hai:
  ```javascript
  const child = spawn('explorer.exe', [exePath], {
    detached: true,
    stdio: 'ignore'
  });
  child.unref();
  ```
- **Fayda**: Windows `explorer.exe` hamesha user ke active Session 1 (`winsta0\default`) mein execute hota hai. Is se `NanoPix.exe` ka full graphical OpenGL window (`HWND`, `Class: 'GLFW30'`, `Visible: True`, 1550x830) screen par create hota hai.

### 2. Win32 Native EnumWindows + AttachThreadInput Window Focuser
- [`scripts/focus_nanopix.ps1`](file:///d:/dentistfrontend/Dentistfrontend/scripts/focus_nanopix.ps1) ko complete Win32 Native C# P/Invoke ke sath upgrade kiya gaya:
  - Win32 `EnumWindows` ke zariye GLFW30 / NanoPix window ki exact `HWND` dhoondta hai (bina `MainWindowHandle` par depend kiye).
  - `AttachThreadInput` + `SetForegroundWindow` + `BringWindowToTop` + `ShowWindowAsync(hWnd, SW_RESTORE)` call karke browser ke upar screen par samne le aata hai.
  - Agar NanoPix pehle se chal raha ho, to `/launch-nanopix` call hone par wo window ko foran screen ke samne (foreground) le aata hai.

### 3. 100% Relative & Portable Paths
- Path hamesha `drivers/eighteeth_engine/1.1.1.9/NanoPix.exe` dynamically resolve hota hai (Koi hardcoded drive letters nahi).

---

## 3. Verified Window Status (Win32 Diagnostics)

PowerShell Win32 Window Inspector se test karke confirm kiya gaya:
```text
PID: 6112 Name: NanoPix SessionId: 1 Handle: 5180642 Title: Path: drivers\eighteeth_engine\1.1.1.9\NanoPix.exe
  ->  HWND: 0xB13D6, Title: 'NanoPix', Class: 'GLFW30', Visible: True, Rect: [-7,-7 -> 1543,823 (1550x830)]
```
`Visible: True` aur full screen dimensions (1550x830) verified hain.

---

## 4. End-to-End Verification Steps for the User

1. Agar agent band ho, to project folder mein **[`START_AGENT.bat`](file:///d:/dentistfrontend/Dentistfrontend/START_AGENT.bat)** ko double-click karke start karein.
2. Web application open karein:
   - [https://dentistfrontend.vercel.app/chart/46](https://dentistfrontend.vercel.app/chart/46)
3. **"Open NanoPix"** / **"Launch Eighteeth App"** button par click karein.
4. `NanoPix.exe` ka dark-theme intraoral acquisition window (Dear ImGui) aapki screen par Chrome browser ke upar samne aa jayega.
