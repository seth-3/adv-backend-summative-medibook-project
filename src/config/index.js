const path = require('path');

require('dotenv').config();

module.exports = {
  port: Number(process.env.PORT) || 3000,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'medibook',
  },
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  auditLogPath: process.env.AUDIT_LOG_PATH || path.join(__dirname, '..', '..', 'logs', 'audit.log'),
};
