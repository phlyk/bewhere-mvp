/**
 * Logger utility for ETL pipeline
 *
 * Uses Winston for structured logging with console and file output.
 */

import { createLogger, format, Logger, transports } from 'winston';

const { combine, timestamp, printf, colorize, errors } = format;

/**
 * Custom log format
 */
const logFormat = printf(({ level, message, timestamp, stack }) => {
  if (stack) {
    return `${timestamp} [${level}] ${message}\n${stack}`;
  }
  return `${timestamp} [${level}] ${message}`;
});

/**
 * Create the logger instance
 */
function createEtlLogger(): Logger {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  return createLogger({
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    format: combine(
      errors({ stack: true }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    ),
    transports: [
      // Console transport with colors in development
      new transports.Console({
        format: combine(
          isDevelopment ? colorize() : format.uncolorize(),
          logFormat,
        ),
      }),
      // File transport for errors
      new transports.File({
        filename: 'logs/etl-error.log',
        level: 'error',
        format: logFormat,
      }),
      // File transport for all logs
      new transports.File({
        filename: 'logs/etl-combined.log',
        format: logFormat,
      }),
    ],
    // Don't exit on handled exceptions
    exitOnError: false,
  });
}

/**
 * Singleton logger instance
 */
export const logger = createEtlLogger();

/**
 * Create a child logger with additional context
 */
export function createChildLogger(context: string): Logger {
  return logger.child({ context });
}
