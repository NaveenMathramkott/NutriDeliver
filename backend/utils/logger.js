import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';

// Create logs directory if it doesn't exist
const ensureLogsDirectory = () => {
  // This would create the directory in a real implementation
  // For now, we'll assume it exists or Winston will handle it
};

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Create Winston logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { 
    service: 'nutrideliver-backend',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Daily rotate file for errors
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d',
      maxSize: '20m'
    }),
    
    // Daily rotate file for all logs
    new winston.transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      maxSize: '20m'
    }),
    
    // Daily rotate file for HTTP requests
    new winston.transports.DailyRotateFile({
      filename: 'logs/access-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      maxFiles: '30d',
      maxSize: '20m'
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Custom log levels for different types of events
export const logTypes = {
  // Authentication events
  AUTH: {
    LOGIN: 'user_login',
    REGISTER: 'user_register',
    LOGOUT: 'user_logout',
    PASSWORD_RESET: 'password_reset'
  },
  
  // Order events
  ORDER: {
    CREATE: 'order_create',
    UPDATE: 'order_update',
    CANCEL: 'order_cancel',
    DELIVER: 'order_deliver'
  },
  
  // Payment events
  PAYMENT: {
    SUCCESS: 'payment_success',
    FAILED: 'payment_failed',
    REFUND: 'payment_refund'
  },
  
  // System events
  SYSTEM: {
    STARTUP: 'system_startup',
    SHUTDOWN: 'system_shutdown',
    ERROR: 'system_error'
  }
};

// Enhanced logging methods
export const logWithContext = (level, message, context = {}) => {
  const logData = {
    ...context,
    timestamp: new Date().toISOString()
  };
  
  logger.log(level, message, logData);
};

// Specific log methods
export const logInfo = (message, context = {}) => {
  logWithContext('info', message, context);
};

export const logError = (message, error = null, context = {}) => {
  const errorContext = {
    ...context,
    errorMessage: error?.message,
    errorStack: error?.stack,
    errorCode: error?.code
  };
  
  logWithContext('error', message, errorContext);
};

export const logWarn = (message, context = {}) => {
  logWithContext('warn', message, context);
};

export const logDebug = (message, context = {}) => {
  logWithContext('debug', message, context);
};

export const logHttp = (req, res, responseTime) => {
  const context = {
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id || 'anonymous',
    userRole: req.user?.role || 'anonymous'
  };
  
  let level = 'http';
  if (res.statusCode >= 400) level = 'warn';
  if (res.statusCode >= 500) level = 'error';
  
  logWithContext(level, 'HTTP Request', context);
};

// Security logging
export const logSecurityEvent = (event, user = null, details = {}) => {
  const context = {
    event,
    userId: user?.id,
    userEmail: user?.email,
    userRole: user?.role,
    ...details,
    security: true
  };
  
  logWithContext('warn', `Security Event: ${event}`, context);
};

// Business event logging
export const logBusinessEvent = (event, data = {}) => {
  const context = {
    event,
    ...data,
    business: true
  };
  
  logWithContext('info', `Business Event: ${event}`, context);
};

// Performance logging
export const logPerformance = (operation, duration, details = {}) => {
  const context = {
    operation,
    duration: `${duration}ms`,
    ...details,
    performance: true
  };
  
  let level = 'info';
  if (duration > 1000) level = 'warn';
  if (duration > 5000) level = 'error';
  
  logWithContext(level, `Performance: ${operation}`, context);
};

// Database query logging
export const logDatabaseQuery = (collection, operation, duration, query = {}) => {
  const context = {
    collection,
    operation,
    duration: `${duration}ms`,
    query: JSON.stringify(query),
    database: true
  };
  
  logWithContext('debug', `Database Query: ${collection}.${operation}`, context);
};

// Export logger instance and methods
export default logger;