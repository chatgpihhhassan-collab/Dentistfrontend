const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec, execSync } = require('child_process');

function getEighteethExecutable() {
  const userHome = os.homedir();
  const candidates = [
    // 1. Current workspace bundled drivers (Priority 1)
    path.join(__dirname, 'drivers', 'eighteeth_engine', 'NanoPix.exe'),
    path.join(__dirname, 'drivers', 'eighteeth_engine', '1.1.1.9', 'NanoPix.exe'),
    path.join(__dirname, 'drivers', 'eighteeth_engine', 'Launch.exe'),
    path.join(__dirname, 'drivers', 'nanopix', '1.1.1.9', 'NanoPix.exe'),
    path.join(__dirname, 'drivers', 'nanopix', 'NanoPix.exe'),

    // 2. User Downloads & Desktop installations
    path.join(userHome, 'Downloads', 'NanoPix', 'NanoPix', '1.1.1.9', 'NanoPix.exe'),
    path.join(userHome, 'Downloads', 'NanoPix', 'NanoPix', 'Launch.exe'),
    path.join(userHome, 'Downloads', 'NanoPix', 'NanoPix', 'NanoPix.exe'),

    // 3. Common drive root installations
    'C:\\NanoPix\\1.1.1.9\\NanoPix.exe',
    'C:\\NanoPix\\Launch.exe',
    'C:\\NanoPix\\NanoPix.exe',
    'D:\\NanoPix\\1.1.1.9\\NanoPix.exe',
    'D:\\NanoPix\\Launch.exe',
    'D:\\NanoPix\\NanoPix.exe',

    // 4. Program Files
    'C:\\Program Files\\Eighteeth\\NanoPix.exe',
    'C:\\Program Files (x86)\\Eighteeth\\NanoPix.exe'
  ];

  return candidates.find(p => p && fs.existsSync(p)) || null;
}

function launchEighteethDesktopApp() {
  const targetExe = getEighteethExecutable();
  if (!targetExe) {
    console.warn('[EIGHTEETH LAUNCHER] ⚠️ Target Eighteeth executable not found on disk.');
    return { success: false, message: 'Eighteeth executable not found on disk.' };
  }

  const workingDir = path.dirname(targetExe);
  console.log(`[EIGHTEETH LAUNCHER] 🚀 Target: ${targetExe} (Working Dir: ${workingDir})`);

  // Method 1: Execute dedicated PowerShell launcher script (handles foreground activation & window management)
  const psScriptPath = path.join(__dirname, 'scripts', 'launch_eighteeth.ps1');
  if (fs.existsSync(psScriptPath)) {
    try {
      const out = execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${psScriptPath}"`, { timeout: 4000 }).toString();
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
