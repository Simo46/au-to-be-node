const pino = require('pino');
const pinoHttp = require('pino-http');

// Get environment variables
const isDev = process.env.NODE_ENV !== 'production';

/**
 * Create a logger instance with the given label
 * @param {string} label - The label for the logger
 * @returns {object} - The configured logger instance
 */
const createLogger = (label) => {
  return pino({
    level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
    base: { service: 'au-to-be-node', label },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    transport: isDev
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            levelFirst: true,
            translateTime: 'SYS:standard',
          },
        }
      : undefined,
  });
};

/**
 * Create HTTP logger middleware
 * @returns {function} Express middleware
 */
const createHttpLogger = () => {
  return pinoHttp({
    logger: createLogger('http'),
    customLogLevel: (res, err) => {
      if (err) return 'error';
      if (res.statusCode >= 400 && res.statusCode < 500) return 'warn';
      if (res.statusCode >= 500) return 'error';
      return 'info';
    },
    customSuccessMessage: (req, res) => {
      return `${req.method} ${req.url} ${res.statusCode}`;
    },
    customErrorMessage: (req, res, err) => {
      return `${req.method} ${req.url} ${res.statusCode} - Error: ${err.message}`;
    },
    customProps: (req, res) => {
      return {
        requestId: req.id,
        userAgent: req.headers['user-agent'],
        responseTime: res.responseTime,
      };
    },
    // Don't log health check endpoint to reduce noise
    autoLogging: {
      ignore: (req) => req.url.includes('/api/health'),
    },
  });
};

module.exports = {
  createLogger,
  createHttpLogger,
};