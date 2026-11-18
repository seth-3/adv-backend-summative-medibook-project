const fs = require('fs/promises');
const path = require('path');
const config = require('../config');

// Appends one JSON line per event to logs/audit.log.
// Uses async fs only, creates logs/ if missing, and never throws:
// if writing the log fails, the user's request must still succeed.
async function logEvent(event, data = {}) {
  const line = `${JSON.stringify({ timestamp: new Date().toISOString(), event, ...data })}\n`;
  try {
    await fs.mkdir(path.dirname(config.auditLogPath), { recursive: true });
    await fs.appendFile(config.auditLogPath, line, 'utf8');
  } catch (err) {
    console.error(`Audit log write failed (${event}):`, err.message);
  }
}

module.exports = { logEvent };
