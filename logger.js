const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logDir = path.join(__dirname, 'logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFormat = winston.format.printf(({ level, message, timestamp, httpRequest }) => {
  return JSON.stringify({
    timestamp,
    severity: level.toUpperCase(),
    message,
    httpRequest
  });
});

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    logFormat
  ),
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'csye6225.log') }),
    new winston.transports.Console()
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(logDir, 'exceptions.log') })
  ]
});

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
});

module.exports = logger;