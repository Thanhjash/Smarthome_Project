// utils/logger.mjs - Optimized for frontend testing
import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// For ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import winston-daily-rotate-file dynamically
let DailyRotateFile;
try {
  // Try to import winston-daily-rotate-file
  const dailyRotate = await import('winston-daily-rotate-file');
  DailyRotateFile = dailyRotate.default;
} catch (error) {
  console.warn('winston-daily-rotate-file not available, falling back to standard file transport');
}

// Ensure logs directory exists
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define severity levels
const levels = {
  error: 0,   // Severe errors that prevent the application from working
  warn: 1,    // Warning conditions that should be addressed
  info: 2,    // Informational messages about normal operations
  http: 3,    // HTTP request logs
  verbose: 4, // More detailed informational messages
  debug: 5    // Detailed debugging information
};

// Define custom colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'white'
};

// Add colors to winston
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  // Add timestamp
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  
  // Add stack trace for errors
  winston.format.errors({ stack: true }),
  
  // Format the output
  winston.format.printf(info => {
    // Format the message
    let log = `${info.timestamp} ${info.level}: ${info.message}`;
    
    // Add stack trace if available
    if (info.stack) {
      log += `\n${info.stack}`;
    }
    
    return log;
  })
);

// Define console format with colors
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(info => {
    return `${info.timestamp} ${info.level}: ${info.message}`;
  })
);

// Determine console log level
const consoleLevel = process.env.LOG_LEVEL || 'info';

// Define transports array
const transports = [
  // Console transport with configurable level
  new winston.transports.Console({
    level: consoleLevel,
    format: consoleFormat
  })
];

// Add file transport if DailyRotateFile is available
if (DailyRotateFile) {
  // Add rotating file for errors
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
      format
    })
  );
  
  // Add rotating file for all logs
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format
    })
  );
} else {
  // Fallback to standard file transport
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format
    })
  );
  
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format
    })
  );
}

// Create the logger with level 'debug'
const logger = winston.createLogger({
  level: 'debug',
  levels,
  format,
  transports,
  // Don't exit on error
  exitOnError: false
});

// Add simplified methods for backward compatibility
const simplifiedLogger = {
  error: (message, ...args) => logger.error(message, ...args),
  warn: (message, ...args) => logger.warn(message, ...args),
  info: (message, ...args) => logger.info(message, ...args),
  http: (message, ...args) => logger.http(message, ...args),
  verbose: (message, ...args) => logger.verbose(message, ...args),
  debug: (message, ...args) => logger.debug(message, ...args),
  
  // Create a stream object for use with morgan (HTTP request logger middleware)
  stream: {
    write: (message) => {
      logger.http(message.trim());
    }
  }
};

export default simplifiedLogger;