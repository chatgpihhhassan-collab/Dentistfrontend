const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const zipDest = path.join(rootDir, 'public', 'DentiaBridge_Setup.zip');
const stageDir = path.join(rootDir, 'temp_stage_bridge');

if (fs.existsSync(stageDir)) fs.rmSync(stageDir, { recursive: true, force: true });
fs.mkdirSync(stageDir, { recursive: true });

const filesToCopy = [
  'REGISTER_DENTIA_PROTOCOL.bat',
  'START_NANOPIX_AUTO_SYNC.bat',
  'UNINSTALL_DENTIA_PROTOCOL.bat',
  'REINSTALL_DENTIA_PROTOCOL.bat',
  'INSTALL_AUTO_STARTUP_SERVICE.bat',
  'START_AGENT.bat',
  'DENTIA_DIAGNOSE.bat',
  'DENTIA_DIAGNOSE.ps1',
  'nanopix_usb_bridge.cjs',
  'launch_engine_util.cjs',
  'package.json'
];

filesToCopy.forEach(f => {
  const src = path.join(rootDir, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(stageDir, f));
  }
});

// Copy scripts folder
const scriptsSrc = path.join(rootDir, 'scripts');
const scriptsDest = path.join(stageDir, 'scripts');
fs.mkdirSync(scriptsDest, { recursive: true });
fs.readdirSync(scriptsSrc).forEach(f => {
  if (!f.includes('create_bridge_zip')) {
    fs.copyFileSync(path.join(scriptsSrc, f), path.join(scriptsDest, f));
  }
});

// Also create a simple 1-click README
fs.writeFileSync(path.join(stageDir, 'README_FIRST.txt'), 
`=== DENTIA CHAIRSIDE HARDWARE SETUP ===

PREREQUISITES:
1. Windows 10 or 11 (64-bit)
2. Node.js installed (free download from https://nodejs.org/ if not already installed)
3. Eighteeth Nano-Pix sensor connected to a USB 2.0 port

1-MINUTE INSTALLATION:
Step 1: Double-click "REGISTER_DENTIA_PROTOCOL.bat"
  - Registers the "dentia-hw://" browser auto-launch protocol.
  - Adds the bridge to Windows Startup (auto-runs on boot).
  - Starts the background bridge immediately on Port 5066.

Step 2: Open https://dentistfrontend.vercel.app/ in Google Chrome / Edge
  - Click the "Hardware" icon in the navigation bar.
  - Click "Launch Hardware Agent Now".
  - Chrome will show a dialog: "Open Dentia Hardware Protocol? dentistfrontend.vercel.app wants to open this application."
  - Check the box "Always allow dentistfrontend.vercel.app to open links of this type" and click [Open Dentia Hardware Protocol].
  - Your sensor status will show "All Systems Operational" (Active & Synced).

TROUBLESHOOTING:
- If Chrome blocks localhost on HTTPS (Vercel):
  Click the Tune/Lock icon next to the URL -> Site Settings -> Insecure Content -> Allow.
- To start the bridge manually at any time:
  Double-click "START_NANOPIX_AUTO_SYNC.bat".
`);

if (fs.existsSync(zipDest)) fs.unlinkSync(zipDest);
execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${stageDir}\\*' -DestinationPath '${zipDest}' -Force"`);
fs.rmSync(stageDir, { recursive: true, force: true });

console.log(`✅ Success! Created: ${zipDest} (${Math.round(fs.statSync(zipDest).size / 1024)} KB)`);
