const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const stageDir = path.join(rootDir, 'temp_stage_bridge7');
const tempZip = path.join(rootDir, 'temp_full_bridge7.zip');

console.log('🧹 Cleaning previous builds...');
if (fs.existsSync(stageDir)) fs.rmSync(stageDir, { recursive: true, force: true });
if (fs.existsSync(tempZip)) fs.unlinkSync(tempZip);
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

console.log('📦 Copying core bridge files...');
filesToCopy.forEach(f => {
  const src = path.join(rootDir, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(stageDir, f));
  }
});

// Copy scripts folder (All necessary bridge & focus helpers)
const scriptsDest = path.join(stageDir, 'scripts');
fs.mkdirSync(scriptsDest, { recursive: true });
const scriptsToInclude = [
  'silent_bridge_launcher.vbs',
  'focus_nanopix.ps1',
  'inspect_windows.ps1',
  'launch_eighteeth.ps1'
];
scriptsToInclude.forEach(scriptFile => {
  const src = path.join(rootDir, 'scripts', scriptFile);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(scriptsDest, scriptFile));
    console.log(`  -> Included helper script: scripts/${scriptFile}`);
  }
});

// Copy the ENTIRE 1.1.1.9 Engine (The Heavy 300MB Folder)
console.log('📦 Copying heavy NanoPix 1.1.1.9 software... (This takes a moment)');
const engineSrc = path.join(rootDir, 'drivers', 'eighteeth_engine', '1.1.1.9');
const engineDest = path.join(stageDir, 'drivers', 'eighteeth_engine', '1.1.1.9');

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(src).forEach(file => {
    const srcFile = path.join(src, file);
    const destFile = path.join(dest, file);
    if (fs.statSync(srcFile).isDirectory()) {
      copyDirSync(srcFile, destFile);
    } else {
      try {
        fs.copyFileSync(srcFile, destFile);
      } catch (e) {
        console.log(`⚠️ Skipped locked file: ${srcFile}`);
      }
    }
  });
}
if (fs.existsSync(engineSrc)) {
  copyDirSync(engineSrc, engineDest);
} else {
  console.log('⚠️ WARNING: NanoPix engine folder not found!');
}

console.log('⏳ Waiting 5 seconds for Windows Defender to release file locks...');
execSync('powershell -Command "Start-Sleep -Seconds 5"');

console.log('🗜️ Compressing to temporary ZIP file using tar...');
execSync(`tar -a -c -f "${tempZip}" -C "${stageDir}" *`, { stdio: 'inherit' });

console.log('🔪 Splitting ZIP into 45MB chunks for GitHub/Vercel bypass...');
const CHUNK_SIZE = 45 * 1024 * 1024; // 45 MB chunks
const zipBuffer = fs.readFileSync(tempZip);

// Clear old chunks
fs.readdirSync(publicDir).forEach(f => {
  if (f.startsWith('DentiaBridge_Part') && f.endsWith('.bin')) {
    fs.unlinkSync(path.join(publicDir, f));
  }
});

let offset = 0;
let partNumber = 1;
const partFiles = [];

while (offset < zipBuffer.length) {
  const chunk = zipBuffer.slice(offset, offset + CHUNK_SIZE);
  const partName = `DentiaBridge_Part${partNumber}.bin`;
  fs.writeFileSync(path.join(publicDir, partName), chunk);
  partFiles.push(partName);
  console.log(`  -> Created ${partName} (${(chunk.length / 1024 / 1024).toFixed(2)} MB)`);
  offset += CHUNK_SIZE;
  partNumber++;
}

console.log('⚙️ Generating Dentia_Web_Installer.bat...');
const batContent = `@echo off
title Dentia Hardware Bridge Auto-Installer
color 0B
echo ========================================================
echo        DENTIA HARDWARE BRIDGE (FULL INSTALLER)
echo ========================================================
echo.
echo This installer will download the full NanoPix software
echo and setup the bridge automatically. Please wait...
echo.

set BASE_URL=https://dentistfrontend.vercel.app

${partFiles.map((p, i) => `echo [${i+1}/${partFiles.length}] Downloading ${p}...
curl -f -# -O "%BASE_URL%/${p}" || (echo Error downloading ${p}! Check internet connection. & pause & exit)`).join('\n')}

echo.
echo [1/3] Combining downloaded chunks into ZIP...
copy /b ${partFiles.join(' + ')} DentiaBridge_Setup.zip >nul

echo [2/3] Extracting files (This may take a minute)...
if exist "DentiaBridge" rmdir /s /q "DentiaBridge"
powershell -NoProfile -Command "Expand-Archive -Path 'DentiaBridge_Setup.zip' -DestinationPath 'DentiaBridge' -Force"

echo [3/3] Installing Bridge Service...
cd DentiaBridge
call REGISTER_DENTIA_PROTOCOL.bat

echo.
echo ========================================================
echo ✅ INSTALLATION COMPLETE!
echo You can now click "Launch Hardware Agent" on the website.
echo ========================================================
pause
`;

fs.writeFileSync(path.join(publicDir, 'Dentia_Web_Installer.bat'), batContent);

console.log('🧹 Cleaning up temp files...');
try {
  fs.rmSync(stageDir, { recursive: true, force: true });
} catch (_) {}
try {
  fs.unlinkSync(tempZip);
} catch (_) {}
fs.unlinkSync(path.join(publicDir, 'DentiaBridge_Setup.zip')); // Remove the old tiny zip

console.log('✅ ALL DONE! The installer is ready at public/Dentia_Web_Installer.bat');
