const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

function getEighteethExecutable() {
  const userHome = os.homedir();
  const candidates = [
    path.join(__dirname, 'drivers', 'eighteeth_engine', '1.1.1.9', 'NanoPix.exe'),
    path.join(__dirname, 'drivers', 'eighteeth_engine', 'NanoPix.exe'),
    path.join(__dirname, 'drivers', 'nanopix', '1.1.1.9', 'NanoPix.exe'),
    path.join(userHome, 'Downloads', 'NanoPix', 'NanoPix', '1.1.1.9', 'NanoPix.exe'),
    'C:\\NanoPix\\1.1.1.9\\NanoPix.exe',
    path.join(userHome, 'Downloads', 'NanoPix', 'NanoPix', 'Launch.exe'),
    'C:\\NanoPix\\Launch.exe'
  ];

  return candidates.find(p => p && fs.existsSync(p)) || null;
}

function launchEighteethDesktopApp() {
  const targetExe = getEighteethExecutable();
  if (!targetExe) {
    console.warn('[EIGHTEETH LAUNCHER] Target executable not found on system.');
    return { success: false, message: 'Eighteeth executable not found on disk.' };
  }

  const workingDir = path.dirname(targetExe);
  console.log(`[EIGHTEETH LAUNCHER] 🚀 Launching: ${targetExe} from ${workingDir}`);

  // 1. Kill any existing zombie or windowless instances
  try {
    exec('taskkill /F /IM NanoPix.exe /T', () => {
      // 2. Launch detached desktop window using spawn
      const { spawn } = require('child_process');
      const child = spawn(targetExe, [], {
        cwd: workingDir,
        detached: true,
        stdio: 'ignore',
        windowsHide: false
      });
      child.unref();
      console.log('[EIGHTEETH LAUNCHER] ✅ Interactive desktop UI spawned successfully.');
    });
  } catch (e) {
    const { spawn } = require('child_process');
    const child = spawn(targetExe, [], {
      cwd: workingDir,
      detached: true,
      stdio: 'ignore',
      windowsHide: false
    });
    child.unref();
  }

  return { success: true, message: 'Eighteeth UI successfully launched on desktop.', targetExe };
}

module.exports = {
  getEighteethExecutable,
  launchEighteethDesktopApp
};
