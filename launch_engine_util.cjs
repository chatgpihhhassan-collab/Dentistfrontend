const fs = require('fs');
const path = require('path');
const { exec, execSync } = require('child_process');

/**
 * Returns the exact absolute path to drivers/eighteeth_engine/1.1.1.9/NanoPix.exe.
 * Dynamically resolves relative to this project workspace directory (__dirname).
 */
function getEighteethExecutable() {
  const primaryExe = path.join(__dirname, 'drivers', 'eighteeth_engine', '1.1.1.9', 'NanoPix.exe');
  if (fs.existsSync(primaryExe)) {
    return primaryExe;
  }
  const fallbackExe = path.join(__dirname, 'drivers', 'eighteeth_engine', 'NanoPix.exe');
  if (fs.existsSync(fallbackExe)) {
    return fallbackExe;
  }
  return null;
}

function launchEighteethDesktopApp() {
  // 1. Check if an active visible GUI window is already open
  try {
    const check = execSync('powershell -NoProfile -Command "Get-Process -Name NanoPix -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -ExpandProperty Id"').toString().trim();
    if (check) {
      console.log(`[EIGHTEETH LAUNCHER] 🌟 Active window found (PID: ${check}). Bringing to foreground...`);
      try {
        execSync(`powershell -NoProfile -Command "(New-Object -ComObject WScript.Shell).AppActivate(${check})"`);
      } catch (_) {}
      return { 
        success: true, 
        message: `Brought existing Eighteeth window (PID: ${check}) to foreground.`, 
        targetExe: getEighteethExecutable() 
      };
    }
  } catch (_) {}

  // 2. Clear any dead/ghost background instances to prevent single-instance mutex deadlock
  try {
    execSync('taskkill /F /IM NanoPix.exe /IM Launch.exe /IM AutoUpdate.exe /T', { stdio: 'ignore' });
  } catch (_) {}

  // 3. Resolve exact NanoPix.exe from project drivers\eighteeth_engine\1.1.1.9
  const targetExe = getEighteethExecutable();
  if (!targetExe) {
    console.warn('[EIGHTEETH LAUNCHER] ⚠️ Target Eighteeth executable not found in drivers/eighteeth_engine/1.1.1.9.');
    return { success: false, message: 'NanoPix.exe not found in drivers/eighteeth_engine/1.1.1.9.' };
  }

  const workingDir = path.dirname(targetExe);
  console.log(`[EIGHTEETH LAUNCHER] 🚀 Project Target: ${targetExe} (Working Dir: ${workingDir})`);

  // 4. Launch interactive desktop GUI via Windows Shell Execute
  try {
    const cmd = `cmd.exe /c start "" /d "${workingDir}" "${targetExe}"`;
    exec(cmd, (err) => {
      if (err) console.warn('[EIGHTEETH LAUNCHER] CMD start error:', err.message);
    });
    return { 
      success: true, 
      message: `Successfully launched Eighteeth Desktop App: ${path.basename(targetExe)}`, 
      targetExe 
    };
  } catch (err) {
    return { success: false, message: err.message, targetExe };
  }
}

module.exports = {
  getEighteethExecutable,
  launchEighteethDesktopApp
};
