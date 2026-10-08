const fs = require('fs');
const path = require('path');
const { exec, execSync } = require('child_process');

/**
 * Returns the absolute path to the project's bundled Eighteeth master executable.
 * Dynamically resolves relative to this project workspace directory (__dirname).
 */
function getEighteethExecutable() {
  const candidates = [
    // 1. Primary: Project workspace bundled Launch.exe (initializes version.ini & boots 1.1.1.9\NanoPix.exe with full GUI)
    path.join(__dirname, 'drivers', 'eighteeth_engine', 'Launch.exe'),

    // 2. Direct version 1.1.1.9 NanoPix.exe binary
    path.join(__dirname, 'drivers', 'eighteeth_engine', '1.1.1.9', 'NanoPix.exe'),

    // 3. Fallbacks within workspace
    path.join(__dirname, 'drivers', 'eighteeth_engine', 'NanoPix.exe'),
    path.join(__dirname, 'drivers', 'nanopix', '1.1.1.9', 'NanoPix.exe'),
    path.join(__dirname, 'drivers', 'nanopix', 'NanoPix.exe')
  ];

  return candidates.find(p => p && fs.existsSync(p)) || null;
}

function launchEighteethDesktopApp() {
  const targetExe = getEighteethExecutable();
  if (!targetExe) {
    console.warn('[EIGHTEETH LAUNCHER] ⚠️ Target Eighteeth executable not found in drivers/eighteeth_engine.');
    return { success: false, message: 'Eighteeth executable not found in project drivers folder.' };
  }

  const workingDir = path.dirname(targetExe);
  console.log(`[EIGHTEETH LAUNCHER] 🚀 Project Target: ${targetExe} (Working Dir: ${workingDir})`);

  // Method 1: Execute dedicated PowerShell launcher script (handles foreground activation & window management)
  const psScriptPath = path.join(__dirname, 'scripts', 'launch_eighteeth.ps1');
  if (fs.existsSync(psScriptPath)) {
    try {
      const out = execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${psScriptPath}"`, { timeout: 6000 }).toString();
      console.log(`[EIGHTEETH LAUNCHER] ✅ Script result: ${out.trim()}`);
      return { success: true, message: out.trim(), targetExe };
    } catch (e) {
      console.warn(`[EIGHTEETH LAUNCHER] PowerShell script notice: ${e.message}. Trying direct CMD launch...`);
    }
  }

  // Method 2: Direct CMD start with proper working directory
  try {
    const cmd = `cmd.exe /c start "" /d "${workingDir}" "${targetExe}"`;
    exec(cmd, (err) => {
      if (err) console.warn('[EIGHTEETH LAUNCHER] CMD start error:', err.message);
    });
    return { success: true, message: 'Eighteeth UI successfully launched on desktop.', targetExe };
  } catch (err) {
    return { success: false, message: err.message, targetExe };
  }
}

module.exports = {
  getEighteethExecutable,
  launchEighteethDesktopApp
};
