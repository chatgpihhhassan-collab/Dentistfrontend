const { exec, execSync } = require('child_process');
const path = require('path');

// 1. Clean any running instances
try {
  execSync('taskkill /F /IM NanoPix.exe /IM Launch.exe /IM AutoUpdate.exe /T', { stdio: 'ignore' });
} catch (_) {}

console.log('Cleaned old processes.');

// Test 1: Run workspace Launch.exe
const launchPath = path.join(__dirname, 'drivers', 'eighteeth_engine', 'Launch.exe');
const workDir = path.join(__dirname, 'drivers', 'eighteeth_engine');

console.log(`Executing Launch.exe from workspace: ${launchPath}...`);
exec(`cmd.exe /c start "" /d "${workDir}" "${launchPath}"`, (err) => {
  if (err) console.error('Launch err:', err);
});

setTimeout(() => {
  try {
    const list = execSync('powershell -NoProfile -Command "Get-Process -Name NanoPix*,Launch*,AutoUpdate* -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, MainWindowTitle, MainWindowHandle, Path | Format-Table -AutoSize"').toString();
    console.log('Process list after Launch.exe:\n', list);
  } catch (e) {
    console.error('Error:', e.message);
  }
}, 3000);
