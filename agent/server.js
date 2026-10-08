/**
 * Dentia Local Hardware Agent
 * Lightweight Node.js server running in the logged-in user desktop session (Session 1).
 * Listens on 127.0.0.1:5055 to launch NanoPix.exe on clinic PCs from the Vercel web app.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

// 1. Load Configuration
let config = {
  PORT: 5055,
  HOST: '127.0.0.1',
  NANOPIX_PATH: '../drivers/eighteeth_engine/NanoPix.exe',
  AGENT_TOKEN: 'dentia-secret-token-2026',
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
  console.warn('[AGENT CONFIG] Warning reading config.json:', err.message);
}

// Support environment variable override
if (process.env.NANOPIX_PATH) config.NANOPIX_PATH = process.env.NANOPIX_PATH;
if (process.env.PORT) config.PORT = parseInt(process.env.PORT, 10);
if (process.env.AGENT_TOKEN) config.AGENT_TOKEN = process.env.AGENT_TOKEN;

/**
 * Resolves the absolute path to NanoPix.exe
 */
function resolveNanoPixPath() {
  const configured = config.NANOPIX_PATH;
  if (path.isAbsolute(configured)) {
    return path.normalize(configured);
  }
  return path.normalize(path.resolve(__dirname, configured));
}

/**
 * Checks if NanoPix.exe is currently running on Windows via tasklist
 */
function isNanoPixRunning() {
  try {
    const output = execSync('tasklist /fi "imagename eq NanoPix.exe" /fo csv /nh', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 1500
    }).toString().trim();

    if (output && output.toLowerCase().includes('nanopix.exe')) {
      const match = output.match(/"NanoPix\.exe","(\d+)"/i);
      return {
        running: true,
        pid: match ? parseInt(match[1], 10) : null
      };
    }
  } catch (_) {}
  return { running: false, pid: null };
}

// 2. HTTP Server & Request Dispatcher
const server = http.createServer((req, res) => {
  const origin = req.headers.origin;
  const isAllowedOrigin = !origin || config.ALLOWED_ORIGINS.includes(origin);

  // Set secure CORS and Private Network Access (PNA) headers
  if (isAllowedOrigin && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-agent-token, Authorization');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${config.HOST}:${config.PORT}`);
  res.setHeader('Content-Type', 'application/json');

  // Endpoint 1: GET /health
  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      ok: true,
      service: 'Dentia Local Hardware Agent',
      version: '1.0.0',
      port: config.PORT,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Endpoint 2: GET /status
  if (req.method === 'GET' && url.pathname === '/status') {
    const exePath = resolveNanoPixPath();
    const exists = fs.existsSync(exePath);
    const processInfo = isNanoPixRunning();

    res.writeHead(200);
    res.end(JSON.stringify({
      ok: true,
      isRunning: processInfo.running,
      pid: processInfo.pid,
      exeFound: exists,
      path: exePath
    }));
    return;
  }

  // Endpoint 3: POST /launch-nanopix
  if (req.method === 'POST' && url.pathname === '/launch-nanopix') {
    // Check shared secret token header
    const tokenHeader = req.headers['x-agent-token'];
    if (config.AGENT_TOKEN && tokenHeader !== config.AGENT_TOKEN) {
      res.writeHead(401);
      res.end(JSON.stringify({
        ok: false,
        error: 'Unauthorized: Invalid or missing x-agent-token header'
      }));
      return;
    }

    // 1. Check if NanoPix.exe is already running
    const runningCheck = isNanoPixRunning();
    if (runningCheck.running) {
      console.log(`[AGENT] ℹ️ NanoPix is already running with PID ${runningCheck.pid}`);
      res.writeHead(200);
      res.end(JSON.stringify({
        ok: true,
        message: 'NanoPix is already running',
        alreadyRunning: true,
        isRunning: true,
        pid: runningCheck.pid
      }));
      return;
    }

    // 2. Validate executable file existence on disk
    const exePath = resolveNanoPixPath();
    if (!fs.existsSync(exePath)) {
      console.error(`[AGENT ERROR] ❌ Executable not found at: ${exePath}`);
      res.writeHead(404);
      res.end(JSON.stringify({
        ok: false,
        error: `NanoPix.exe not found at specified path: ${exePath}`,
        path: exePath
      }));
      return;
    }

    // 3. Launch NanoPix.exe inside the active interactive user session
    const workingDir = path.dirname(exePath);
    console.log(`[AGENT LAUNCH] 🚀 Spawning NanoPix in user session: ${exePath}`);
    console.log(`[AGENT LAUNCH] 📂 Working Directory: ${workingDir}`);

    try {
      const child = spawn(exePath, [], {
        cwd: workingDir,
        detached: true,
        stdio: 'ignore',
        windowsHide: false,
        shell: false
      });
      child.unref();

      console.log(`[AGENT SUCCESS] ✅ NanoPix process spawned (PID: ${child.pid})`);

      res.writeHead(200);
      res.end(JSON.stringify({
        ok: true,
        message: 'NanoPix.exe launched successfully in desktop session',
        path: exePath,
        pid: child.pid
      }));
    } catch (launchErr) {
      console.error(`[AGENT ERROR] ❌ Failed to spawn process:`, launchErr.message);
      res.writeHead(500);
      res.end(JSON.stringify({
        ok: false,
        error: `Failed to spawn NanoPix.exe: ${launchErr.message}`,
        path: exePath
      }));
    }
    return;
  }

  // 404 Fallback
  res.writeHead(404);
  res.end(JSON.stringify({ ok: false, error: 'Endpoint not found' }));
});

// Bind exclusively to 127.0.0.1 (Localhost Only)
server.listen(config.PORT, config.HOST, () => {
  console.log('================================================================');
  console.log(`  🏥 DENTIA LOCAL HARDWARE AGENT ACTIVE ON ${config.HOST}:${config.PORT}`);
  console.log(`  🔗 Health Check: http://${config.HOST}:${config.PORT}/health`);
  console.log(`  🎯 Target Binary: ${resolveNanoPixPath()}`);
  console.log(`  🛡️ Allowed Origins: ${config.ALLOWED_ORIGINS.join(', ')}`);
  console.log('================================================================');
});
