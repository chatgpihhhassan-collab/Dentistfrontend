const fs = require('fs');
const path = require('path');
const { exec, execSync, spawn } = require('child_process');

/**
 * Returns the exact path to drivers/eighteeth_engine/NanoPix.exe within this workspace or system.
 */
function getEighteethExecutable() {
  const os = require('os');
  const userHome = os.homedir();
  
  const candidateLaunchers = [
    // Local bundled paths
    path.join(__dirname, 'drivers', 'eighteeth_engine', '1.1.1.9', 'NanoPix.exe'),
    path.join(__dirname, 'drivers', 'eighteeth_engine', 'NanoPix.exe'),
    path.join(__dirname, 'drivers', 'nanopix', '1.1.1.9', 'NanoPix.exe'),
    // System / standard installation paths
    'C:\\NanoPix\\1.1.1.9\\NanoPix.exe',
    'C:\\NanoPix\\Launch.exe',
    path.join(userHome, 'Downloads', 'NanoPix', 'NanoPix', '1.1.1.9', 'NanoPix.exe'),
    path.join(userHome, 'Downloads', 'NanoPix', 'NanoPix', 'Launch.exe'),
    'C:\\Program Files\\NanoPix\\NanoPix.exe',
    'C:\\Program Files (x86)\\NanoPix\\NanoPix.exe'
  ];

  const targetExe = candidateLaunchers.find(p => p && fs.existsSync(p));
  return targetExe || null;
}

function launchEighteethDesktopApp() {
  const targetExe = getEighteethExecutable();
  if (!targetExe) {
    console.warn('[EIGHTEETH LAUNCHER] ⚠️ NanoPix.exe not found in drivers/eighteeth_engine or system paths.');
    return { success: false, message: 'NanoPix.exe not found in drivers/eighteeth_engine or system paths.' };
  }

  // Ensure default PatientData directory exists so engine never fails on missing directory
  try {
    if (!fs.existsSync('C:\\PatientData')) {
      fs.mkdirSync('C:\\PatientData', { recursive: true });
    }
  } catch (_) {}

  // 1. Check if NanoPix is ALREADY running WITH an active window
  let hasActiveWindow = false;
  try {
    const activePids = execSync(
      'powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$p = Get-Process -Name NanoPix -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 }; if ($p) { $p.Id }"',
      { stdio: ['ignore', 'pipe', 'ignore'], timeout: 2000 }
    ).toString().trim();
    if (activePids) {
      hasActiveWindow = true;
    }
  } catch (_) {}

  if (hasActiveWindow) {
    console.log('[EIGHTEETH LAUNCHER] ℹ️ NanoPix is already running with an active window. Bringing window to front.');
    const focusScript = path.join(__dirname, 'scripts', 'focus_nanopix.ps1');
    if (fs.existsSync(focusScript)) {
      try {
        spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', focusScript], {
          stdio: 'ignore',
          detached: true,
          windowsHide: true
        }).unref();
      } catch (_) {}
    }
    return {
      success: true,
      ok: true,
      alreadyRunning: true,
      message: 'NanoPix is already running (focused window)',
      relativePath: 'drivers/eighteeth_engine/1.1.1.9/NanoPix.exe',
      targetExe: 'drivers/eighteeth_engine/1.1.1.9/NanoPix.exe'
    };
  }

  // 2. If a stuck/headless zombie process with NO window is running, terminate it first!
  try {
    const list = execSync('tasklist /FI "IMAGENAME eq NanoPix.exe" /FO CSV /NH', { stdio: ['ignore', 'pipe', 'ignore'], timeout: 1500 }).toString();
    if (list.toLowerCase().includes('nanopix.exe')) {
      console.log('[EIGHTEETH LAUNCHER] ⚠️ Detected stuck/headless NanoPix zombie process (0 HWND). Terminating to launch fresh interactive UI...');
      execSync('taskkill /F /IM NanoPix.exe /IM Launch.exe /T 2>nul', { stdio: 'ignore', timeout: 2000 });
    }
  } catch (_) {}

  const workingDir = path.dirname(targetExe);
  console.log(`[EIGHTEETH LAUNCHER] 🚀 Launching interactive UI: ${targetExe} (Working Dir: ${workingDir})`);

  try {
    // Launch via Windows Shell Start: guarantees top-level interactive desktop window
    // in active user session (winsta0\\default) with SW_SHOWNORMAL (never hidden)
    const child = spawn('cmd.exe', ['/c', 'start', '""', '/d', workingDir, targetExe], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();

    const focusScript = path.join(__dirname, 'scripts', 'focus_nanopix.ps1');
    if (fs.existsSync(focusScript)) {
      setTimeout(() => {
        try {
          spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', focusScript], {
            stdio: 'ignore',
            detached: true,
            windowsHide: true
          }).unref();
        } catch (_) {}
      }, 1500);

      setTimeout(() => {
        try {
          spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', focusScript], {
            stdio: 'ignore',
            detached: true,
            windowsHide: true
          }).unref();
        } catch (_) {}
      }, 3000);
    }

    return { 
      success: true, 
      ok: true,
      message: 'Successfully launched Eighteeth Desktop App: NanoPix.exe', 
      relativePath: 'drivers/eighteeth_engine/1.1.1.9/NanoPix.exe',
      targetExe: 'drivers/eighteeth_engine/1.1.1.9/NanoPix.exe'
    };
  } catch (err) {
    console.error('[EIGHTEETH LAUNCHER ERROR]:', err.message);
    return {
      success: false,
      ok: false,
      error: err.message,
      relativePath: 'drivers/eighteeth_engine/NanoPix.exe'
    };
  }
}

module.exports = {
  getEighteethExecutable,
  launchEighteethDesktopApp
};
