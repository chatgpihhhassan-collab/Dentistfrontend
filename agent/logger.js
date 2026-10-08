/**
 * Dentia Local Hardware Agent - Enterprise Logger
 * - Daily rotating log files (agent-YYYY-MM-DD.log)
 * - Auto-clean logs older than 7 days
 * - Structured log format: [ISO timestamp] [LEVEL] [requestId] message {details}
 * - Console + File output with configurable LOG_LEVEL
 */

const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, 'logs');
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

function getLogLevel() {
  const envLevel = (process.env.LOG_LEVEL || 'DEBUG').toUpperCase();
  return LEVELS[envLevel] !== undefined ? LEVELS[envLevel] : LEVELS.DEBUG;
}

function getLogFileName(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `agent-${yyyy}-${mm}-${dd}.log`;
}

function cleanOldLogs(maxDays = 7) {
  try {
    const files = fs.readdirSync(LOGS_DIR);
    const now = Date.now();
    const maxAgeMs = maxDays * 24 * 60 * 60 * 1000;

    files.forEach(file => {
      if (file.startsWith('agent-') && file.endsWith('.log')) {
        const filePath = path.join(LOGS_DIR, file);
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > maxAgeMs) {
          fs.unlinkSync(filePath);
          console.log(`[LOGGER CLEANUP] Removed old log file: ${file}`);
        }
      }
    });
  } catch (err) {
    console.warn('[LOGGER CLEANUP ERROR]:', err.message);
  }
}

// Run cleanup on initialization
cleanOldLogs();

function formatMessage(level, requestId, message, details) {
  const timestamp = new Date().toISOString();
  const reqIdStr = requestId ? `[${requestId}]` : '[SYSTEM]';
  let formatted = `[${timestamp}] [${level.padEnd(5)}] ${reqIdStr} ${message}`;

  if (details !== undefined && details !== null) {
    if (details instanceof Error) {
      formatted += `\nStack: ${details.stack || details.message}`;
    } else if (typeof details === 'object') {
      try {
        formatted += ` ${JSON.stringify(details)}`;
      } catch (_) {
        formatted += ` [Unserializable Object]`;
      }
    } else {
      formatted += ` ${details}`;
    }
  }

  return formatted;
}

function writeLog(level, requestId, message, details) {
  const currentThreshold = getLogLevel();
  if (LEVELS[level] < currentThreshold) {
    return;
  }

  const line = formatMessage(level, requestId, message, details);

  // 1. Write to Console
  if (level === 'ERROR') {
    console.error(line);
  } else if (level === 'WARN') {
    console.warn(line);
  } else {
    console.log(line);
  }

  // 2. Write to Today's Log File
  try {
    const logFilePath = path.join(LOGS_DIR, getLogFileName());
    fs.appendFileSync(logFilePath, line + '\n', 'utf8');
  } catch (err) {
    console.error('[LOGGER WRITE ERROR]:', err.message);
  }
}

const logger = {
  debug: (message, details = null, requestId = null) => writeLog('DEBUG', requestId, message, details),
  info: (message, details = null, requestId = null) => writeLog('INFO', requestId, message, details),
  warn: (message, details = null, requestId = null) => writeLog('WARN', requestId, message, details),
  error: (message, details = null, requestId = null) => writeLog('ERROR', requestId, message, details),

  generateRequestId: () => {
    return 'req-' + Math.random().toString(36).substring(2, 8) + '-' + Date.now().toString(36);
  },

  getRecentLogs: (linesCount = 100) => {
    try {
      const logFilePath = path.join(LOGS_DIR, getLogFileName());
      if (!fs.existsSync(logFilePath)) {
        return [];
      }
      const content = fs.readFileSync(logFilePath, 'utf8');
      const lines = content.split('\n').filter(Boolean);
      return lines.slice(-linesCount);
    } catch (err) {
      return [`Error reading log file: ${err.message}`];
    }
  },

  getLogFilePath: () => path.join(LOGS_DIR, getLogFileName()),
  getLogsDir: () => LOGS_DIR
};

module.exports = logger;
