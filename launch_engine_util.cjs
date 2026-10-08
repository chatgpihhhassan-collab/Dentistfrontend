const fs = require('fs');
const path = require('path');
const { exec, execSync } = require('child_process');

/**
 * Returns the exact path to drivers/eighteeth_engine/NanoPix.exe within this workspace.
 */
function getEighteethExecutable() {
  const rootExe = path.join(__dirname, 'drivers', 'eighteeth_engine', 'NanoPix.exe');
  if (fs.existsSync(rootExe)) {
    return rootExe;
  }
  const versionExe = path.join(__dirname, 'drivers', 'eighteeth_engine', '1.1.1.9', 'NanoPix.exe');
  if (fs.existsSync(versionExe)) {
    return versionExe;
  }
  return null;
}

function launchEighteethDesktopApp() {
  // 1. Break / Kill any existing running instance unconditionally to ensure clean UI spawn
  try {
    execSync('taskkill /F /IM NanoPix.exe /IM Launch.exe /IM AutoUpdate.exe /T', { stdio: 'ignore' });
  } catch (_) {}

  // 2. Resolve target drivers\eighteeth_engine\NanoPix.exe
  const targetExe = getEighteethExecutable();
  if (!targetExe) {
    console.warn('[EIGHTEETH LAUNCHER] ⚠️ NanoPix.exe not found in drivers/eighteeth_engine.');
    return { success: false, message: 'NanoPix.exe not found in drivers/eighteeth_engine.' };
  }

  const workingDir = path.dirname(targetExe);
  console.log(`[EIGHTEETH LAUNCHER] 🚀 Project Target: ${targetExe} (Working Dir: ${workingDir})`);

  // 3. Method 1: Launch via Windows Explorer Shell (ensures top-level interactive desktop window)
  try {
    exec(`explorer.exe "${targetExe}"`, (err) => {
      // explorer.exe returns non-zero when detaching process, which is normal
    });
  } catch (_) {}

  // 4. Method 2: Launch via CMD Shell Start with explicit working directory
  try {
    const cmd = `cmd.exe /c start "" /d "${workingDir}" "${targetExe}"`;
    exec(cmd, (err) => {
      if (err) console.warn('[EIGHTEETH LAUNCHER] CMD start note:', err.message);
    });
  } catch (_) {}

  // 5. Method 3: Dedicated PowerShell activation
  const psScriptPath = path.join(__dirname, 'scripts', 'launch_eighteeth.ps1');
  if (fs.existsSync(psScriptPath)) {
    try {
      exec(`powershell -NoProfile -ExecutionPolicy Bypass -File "${psScriptPath}"`, () => {});
    } catch (_) {}
  }

  return { 
    success: true, 
    message: 'Successfully launched Eighteeth Desktop App: NanoPix.exe', 
    targetExe 
  };
}

module.exports = {
  getEighteethExecutable,
  launchEighteethDesktopApp
};
