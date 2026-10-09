/**
 * Dentia Local Hardware Agent - Server with Diagnostic Telemetry
 * Runs in logged-in user desktop session (Session 1) on 127.0.0.1:5055.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execSync } = require('child_process');
const logger = require('./logger');

// 1. Load Configuration
let config = {
  PORT: 5055,
  HOST: '127.0.0.1',
  NANOPIX_PATH: '../drivers/eighteeth_engine/1.1.1.9/NanoPix.exe',
  AGENT_TOKEN: 'dentia-secret-token-2026',
  DEBUG_CAPTURE: false,
  ALLOWED_ORIGINS: [
    'https://dentistfrontend.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ]
};

try {
  const configPath = path.join(__dirname, 'config.json');
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(raw);
    config = { ...config, ...parsed };
  }
} catch (err) {
  logger.warn('Failed to parse config.json, using defaults', { error: err.message });
}

// Environment Variable Overrides
if (process.env.NANOPIX_PATH) config.NANOPIX_PATH = process.env.NANOPIX_PATH;
if (process.env.PORT) config.PORT = parseInt(process.env.PORT, 10);
if (process.env.AGENT_TOKEN) config.AGENT_TOKEN = process.env.AGENT_TOKEN;
if (process.env.DEBUG_CAPTURE) config.DEBUG_CAPTURE = process.env.DEBUG_CAPTURE === 'true';

/**
 * Resolves absolute path to NanoPix.exe
 */
function resolveNanoPixPath() {
  const configured = config.NANOPIX_PATH;
  if (path.isAbsolute(configured)) {
    return path.normalize(configured);
  }
  return path.normalize(path.resolve(__dirname, configured));
}

/**
 * Diagnostic helper: Check if running as Administrator
 */
function checkIsAdmin() {
  try {
    execSync('fltmc', { stdio: ['ignore', 'ignore', 'ignore'], timeout: 1000 });
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Diagnostic helper: Get Windows Session Name / ID (Session 0 vs Session 1)
 */
function getWindowsSessionInfo() {
  let sessionOutput = 'Unknown';
  let whoamiOutput = 'Unknown';
  let isSession0 = false;

  try {
    whoamiOutput = execSync('whoami', { stdio: ['ignore', 'pipe', 'ignore'], timeout: 1500 }).toString().trim();
  } catch (_) {}

  try {
    sessionOutput = execSync('query session', { stdio: ['ignore', 'pipe', 'ignore'], timeout: 2000 }).toString().trim();
    if (sessionOutput.toLowerCase().includes('services') && !sessionOutput.toLowerCase().includes('console')) {
      isSession0 = true;
    }
  } catch (_) {
    sessionOutput = 'query session not available on this edition';
  }

  return {
    whoami: whoamiOutput,
    sessionList: sessionOutput,
    isLikelySession0: isSession0
  };
}

/**
 * Detailed Tasklist inspection for NanoPix.exe
 */
function getDetailedNanoPixProcess() {
  try {
    // /V provides Session Name, Window Title, Memory, CPU
    const output = execSync('tasklist /FI "IMAGENAME eq NanoPix.exe" /V /FO CSV', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 2000
    }).toString().trim();

    if (output && output.toLowerCase().includes('nanopix.exe')) {
      const lines = output.split('\n').filter(Boolean);
      const dataLine = lines.find(l => l.toLowerCase().includes('nanopix.exe'));
      if (dataLine) {
        // Format: "Image Name","PID","Session Name","Session#","Mem Usage","Status","User Name","CPU Time","Window Title"
        const parts = dataLine.split('","').map(s => s.replace(/"/g, '').trim());
        return {
          found: true,
          imageName: parts[0] || 'NanoPix.exe',
          pid: parts[1] ? parseInt(parts[1], 10) : null,
          sessionName: parts[2] || 'Unknown',
          sessionNumber: parts[3] || 'Unknown',
          memUsage: parts[4] || 'Unknown',
          userName: parts[6] || 'Unknown',
          windowTitle: parts[8] || '(No Title)',
          raw: dataLine
        };
      }
    }
  } catch (_) {}
  return { found: false, pid: null, sessionName: null, windowTitle: null };
}

/**
 * Full Environment Diagnostics Object
 */
function collectEnvironmentDiagnostics(requestId = null) {
  const exePath = resolveNanoPixPath();
  const exeDir = path.dirname(exePath);
  const exeExists = fs.existsSync(exePath);

  let fileStats = null;
  let dirContents = [];

  if (exeExists) {
    try {
      const stat = fs.statSync(exePath);
      fileStats = {
        sizeBytes: stat.size,
        sizeMb: (stat.size / (1024 * 1024)).toFixed(2) + ' MB',
        modified: stat.mtime.toISOString(),
        created: stat.birthtime ? stat.birthtime.toISOString() : null
      };
    } catch (e) {
      fileStats = { error: e.message };
    }
  }

  if (fs.existsSync(exeDir)) {
    try {
      dirContents = fs.readdirSync(exeDir);
    } catch (e) {
      dirContents = [`Error reading dir: ${e.message}`];
    }
  }

  const sessionInfo = getWindowsSessionInfo();
  const isAdmin = checkIsAdmin();
  const procInfo = getDetailedNanoPixProcess();

  const diag = {
    agentProcess: {
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd(),
      __dirname: __dirname,
      user: os.userInfo().username,
      hostname: os.hostname(),
      isAdmin: isAdmin
    },
    windowsSession: sessionInfo,
    nanoPixFile: {
      configuredPath: config.NANOPIX_PATH,
      resolvedPath: exePath,
      directory: exeDir,
      exists: exeExists,
      stats: fileStats,
      directoryFileCount: dirContents.length,
      importantDllsFound: dirContents.filter(f => /\.dll$/i.test(f)).slice(0, 20)
    },
    currentRunningProcess: procInfo,
    timestamp: new Date().toISOString()
  };

  return diag;
}

// 2. HTTP Server & Request Handler
const server = http.createServer((req, res) => {
  const startTime = Date.now();
  const requestId = logger.generateRequestId();
  const origin = req.headers.origin || '';
  const clientIp = req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const url = new URL(req.url, `http://${config.HOST}:${config.PORT}`);

  // Token Validation
  const providedToken = req.headers['x-agent-token'] || url.searchParams.get('token');
  const hasValidToken = !config.AGENT_TOKEN || providedToken === config.AGENT_TOKEN;

  // Log Request Receipt
  logger.info(`HTTP ${req.method} ${url.pathname}`, {
    method: req.method,
    url: url.pathname,
    origin: origin || '(none)',
    clientIp: clientIp,
    userAgent: userAgent,
    tokenValid: Boolean(hasValidToken)
  }, requestId);

  // Set CORS and Chrome/Edge Private Network Access (PNA) Headers
  const isAllowedOrigin = !origin || config.ALLOWED_ORIGINS.includes(origin);
  if (isAllowedOrigin && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-agent-token, Authorization');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('X-Request-Id', requestId);
  res.setHeader('Content-Type', 'application/json');

  // Intercept completion to log response status and duration
  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    logger.info(`Response completed: ${res.statusCode} in ${durationMs}ms`, {
      statusCode: res.statusCode,
      durationMs: durationMs
    }, requestId);
  });

  // Handle Preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Endpoint 1: GET /health
  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      ok: true,
      service: 'Dentia Local Hardware Agent',
      version: '1.0.0',
      port: config.PORT,
      requestId: requestId,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Endpoint 2: GET /status
  if (req.method === 'GET' && url.pathname === '/status') {
    const exePath = resolveNanoPixPath();
    const exists = fs.existsSync(exePath);
    const procInfo = getDetailedNanoPixProcess();

    logger.debug('Status check executed', {
      exeFound: exists,
      isRunning: procInfo.found,
      pid: procInfo.pid,
      windowTitle: procInfo.windowTitle
    }, requestId);

    res.writeHead(200);
    res.end(JSON.stringify({
      ok: true,
      isRunning: procInfo.found,
      pid: procInfo.pid,
      sessionName: procInfo.sessionName,
      windowTitle: procInfo.windowTitle,
      exeFound: exists,
      path: exePath,
      requestId: requestId
    }));
    return;
  }

  // Endpoint 3: GET /diagnostics
  if (req.method === 'GET' && url.pathname === '/diagnostics') {
    const diagnosticsData = collectEnvironmentDiagnostics(requestId);
    logger.info('Diagnostics dump generated', {
      user: diagnosticsData.agentProcess.user,
      isAdmin: diagnosticsData.agentProcess.isAdmin,
      exeFound: diagnosticsData.nanoPixFile.exists
    }, requestId);

    res.writeHead(200);
    res.end(JSON.stringify({
      ok: true,
      requestId: requestId,
      diagnostics: diagnosticsData
    }));
    return;
  }

  // Endpoint 4: GET /logs?lines=100 (Protected by x-agent-token)
  if (req.method === 'GET' && url.pathname === '/logs') {
    if (!hasValidToken) {
      logger.warn('Unauthorized access attempt to /logs', { ip: clientIp }, requestId);
      res.writeHead(401);
      res.end(JSON.stringify({ ok: false, error: 'Unauthorized: Invalid token', requestId }));
      return;
    }

    const linesCount = parseInt(url.searchParams.get('lines') || '100', 10);
    const lines = logger.getRecentLogs(linesCount);

    res.writeHead(200);
    res.end(JSON.stringify({
      ok: true,
      requestId: requestId,
      logFile: logger.getLogFilePath(),
      count: lines.length,
      lines: lines
    }));
    return;
  }

  const isLaunchEndpoint = [
    '/launch-nanopix',
    '/nanopix/launch-engine',
    '/nanopix/launch',
    '/nanopix/open-app'
  ].includes(url.pathname);

  // Endpoint 5: POST & GET /launch-nanopix / /nanopix/launch-engine
  if ((req.method === 'POST' || req.method === 'GET') && isLaunchEndpoint) {
    const isLocalhostDirect = (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1');

    // 1. Validate Secret Token Header (or allow direct local loopback browser testing)
    if (!hasValidToken && !isLocalhostDirect) {
      logger.warn('Launch rejected: Invalid or missing x-agent-token header', { ip: clientIp }, requestId);
      res.writeHead(401);
      res.end(JSON.stringify({
        ok: false,
        error: 'Unauthorized: Invalid or missing x-agent-token header',
        requestId: requestId
      }));
      return;
    }

    // 2. Log Full Pre-Launch Environment & Session Info
    const envDiag = collectEnvironmentDiagnostics(requestId);
    logger.info('Pre-launch environment verification', {
      user: envDiag.agentProcess.user,
      hostname: envDiag.agentProcess.hostname,
      isAdmin: envDiag.agentProcess.isAdmin,
      cwd: envDiag.agentProcess.cwd,
      targetExe: envDiag.nanoPixFile.resolvedPath,
      exeExists: envDiag.nanoPixFile.exists,
      fileSize: envDiag.nanoPixFile.stats ? envDiag.nanoPixFile.stats.sizeMb : 'N/A'
    }, requestId);

    // 3. Check if already running
    const runningProc = getDetailedNanoPixProcess();
    if (runningProc.found) {
      logger.info(`NanoPix is already running (PID: ${runningProc.pid}, Title: "${runningProc.windowTitle}"). Bringing window to front.`, runningProc, requestId);
      
      // Force bring existing window to foreground
      const focusScript = path.resolve(__dirname, '../scripts/focus_nanopix.ps1');
      if (fs.existsSync(focusScript)) {
        try {
          spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', focusScript], {
            stdio: 'ignore',
            detached: true,
            windowsHide: true
          }).unref();
        } catch (_) {}
      }

      res.writeHead(200);
      res.end(JSON.stringify({
        ok: true,
        message: 'NanoPix is already running (focused window)',
        alreadyRunning: true,
        isRunning: true,
        pid: runningProc.pid,
        sessionName: runningProc.sessionName,
        windowTitle: runningProc.windowTitle,
        requestId: requestId
      }));
      return;
    }

    // 4. File existence validation
    const exePath = envDiag.nanoPixFile.resolvedPath;
    if (!envDiag.nanoPixFile.exists) {
      logger.error(`NanoPix.exe not found at specified path: ${exePath}`, {
        searchedPath: exePath,
        configuredPath: config.NANOPIX_PATH
      }, requestId);

      res.writeHead(404);
      res.end(JSON.stringify({
        ok: false,
        error: `NanoPix.exe not found at specified path: ${exePath}`,
        path: exePath,
        requestId: requestId
      }));
      return;
    }

    // 5. Spawn Options Setup - Use Explorer Shell for guaranteed Interactive Desktop UI
    const workingDir = path.dirname(exePath);

    logger.info(`Spawning NanoPix.exe via Windows Desktop Shell (Explorer / Start)`, {
      executable: exePath,
      workingDir: workingDir
    }, requestId);

    try {
      // Spawn via cmd.exe /c start (guarantees interactive desktop UI in winsta0\default)
      const child = spawn('cmd.exe', ['/c', 'start', '""', '/d', workingDir, exePath], {
        detached: true,
        stdio: 'ignore'
      });
      child.unref();

      logger.info(`NanoPix launched via Windows Shell Start`, { executable: exePath, workingDir: workingDir }, requestId);

      // Bring Window to Foreground over browser
      const focusScript = path.resolve(__dirname, '../scripts/focus_nanopix.ps1');
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

      // 6. Post-Launch Verification at 2 seconds and 5 seconds
      setTimeout(() => {
        const verify2s = getDetailedNanoPixProcess();
        if (verify2s.found) {
          if (verify2s.sessionName && verify2s.sessionName.toLowerCase().includes('services')) {
            logger.warn(`⚠️ Process Session 0 (Services) mein chal raha hai, desktop UI nahi dikhegi! Agent ko normal user interactive session mein chalayein.`, verify2s, requestId);
          } else {
            logger.info(`✅ [2s Verification] NanoPix running interactively (PID: ${verify2s.pid}, Title: "${verify2s.windowTitle}", Session: ${verify2s.sessionName})`, verify2s, requestId);
          }
        } else {
          logger.warn(`[2s Verification] NanoPix process not found in tasklist. Checking 5s window...`, null, requestId);
        }
      }, 2000);

      setTimeout(() => {
        const verify5s = getDetailedNanoPixProcess();
        if (verify5s.found) {
          logger.info(`✅ [5s Verification] NanoPix verified active (PID: ${verify5s.pid}, Title: "${verify5s.windowTitle}", Session: ${verify5s.sessionName})`, verify5s, requestId);
        } else {
          logger.error(`❌ [5s Verification] NanoPix process is NOT running. Application exited after startup.`, {
            troubleshooting: 'Check physical USB sensor cable, Event Viewer > Application logs, or missing DLLs.'
          }, requestId);
        }
      }, 5000);

      // Return immediate success response to browser
      res.writeHead(200);
      res.end(JSON.stringify({
        ok: true,
        message: 'NanoPix.exe launched successfully in desktop session',
        relativePath: 'drivers/eighteeth_engine/1.1.1.9/NanoPix.exe',
        path: exePath,
        executable: 'NanoPix.exe',
        requestId: requestId
      }));

    } catch (spawnErr) {
      logger.error(`Failed to spawn NanoPix.exe`, { error: spawnErr.message, stack: spawnErr.stack }, requestId);
      res.writeHead(500);
      res.end(JSON.stringify({
        ok: false,
        error: `Failed to spawn NanoPix.exe: ${spawnErr.message}`,
        path: exePath,
        requestId: requestId
      }));
    }
    return;
  }

  // 404 Fallback
  logger.warn(`404 Not Found: ${req.method} ${url.pathname}`, null, requestId);
  res.writeHead(404);
  res.end(JSON.stringify({ ok: false, error: 'Endpoint not found', requestId }));
});

// Bind exclusively to 127.0.0.1
server.listen(config.PORT, config.HOST, () => {
  logger.info('================================================================');
  logger.info(`  🏥 DENTIA LOCAL HARDWARE AGENT ACTIVE ON ${config.HOST}:${config.PORT}`);
  logger.info(`  🔗 Health Check: http://${config.HOST}:${config.PORT}/health`);
  logger.info(`  📊 Diagnostics: http://${config.HOST}:${config.PORT}/diagnostics`);
  logger.info(`  📄 Log File:    ${logger.getLogFilePath()}`);
  logger.info(`  🎯 Target Exe:   ${resolveNanoPixPath()}`);
  logger.info('================================================================');
});
