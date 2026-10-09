const fs = require('fs');
const path = require('path');
const { exec, execSync, spawn } = require('child_process');

/**
 * Returns the exact path to drivers/eighteeth_engine/NanoPix.exe within this workspace.
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
    path.join(userHome, 'Downloads', 'NanoPix', 'NanoPix', '1.1.1.9', 'NanoPix.exe'),
    'C:\\NanoPix\\1.1.1.9\\NanoPix.exe',
    path.join(userHome, 'Downloads', 'NanoPix', 'NanoPix', 'Launch.exe'),
    'C:\\NanoPix\\Launch.exe',
    'C:\\Program Files\\NanoPix\\NanoPix.exe',
    'C:\\Program Files (x86)\\NanoPix\\NanoPix.exe'
  ];

  const targetExe = candidateLaunchers.find(p => p && fs.existsSync(p));
  return targetExe || null;
}

function launchEighteethDesktopApp() {
  const targetExe = getEighteethExecutable();
  if (!targetExe) {
    console.warn('[EIGHTEETH LAUNCHER] ⚠️ NanoPix.exe not found in drivers/eighteeth_engine.');
    return { success: false, message: 'NanoPix.exe not found in drivers/eighteeth_engine.' };
  }

  // 1. Check if already running
  try {
    const list = execSync('tasklist /FI "IMAGENAME eq NanoPix.exe" /FO CSV /NH', { stdio: ['ignore', 'pipe', 'ignore'], timeout: 1500 }).toString();
    if (list.toLowerCase().includes('nanopix.exe')) {
      console.log('[EIGHTEETH LAUNCHER] ℹ️ NanoPix is already running in active session. Bringing window to front.');
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
  } catch (_) {}

  const workingDir = path.dirname(targetExe);
  console.log(`[EIGHTEETH LAUNCHER] 🚀 Launching: ${targetExe} (Working Dir: ${workingDir})`);

  try {
    const child = spawn('powershell.exe', [
      '-ExecutionPolicy', 'Bypass',
      '-WindowStyle', 'Hidden',
      '-Command', `Start-Process -FilePath '${targetExe}' -WorkingDirectory '${workingDir}'`
    ], {
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
      }, 1200);

      setTimeout(() => {
        try {
          spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', focusScript], {
            stdio: 'ignore',
            detached: true,
            windowsHide: true
          }).unref();
        } catch (_) {}
      }, 2500);
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
