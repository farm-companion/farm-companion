/**
 * Structured logging utility for Farm Companion
 *
 * Provides consistent structured logging across API routes and server components.
 * Logs are formatted as JSON in production for machine parsing, and as readable
 * text in development.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  /** Route or component name */
  route?: string
  /** Request ID for tracing */
  requestId?: string
  /** HTTP method */
  method?: string
  /** User IP or identifier */
  userId?: string
  /** Additional metadata */
  [key: string]: any
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  /**
   * Format log entry for output
   */
  private formatLog(entry: LogEntry): string {
    if (this.isDevelopment) {
      const timestamp = new Date(entry.timestamp).toISOString()
      const level = entry.level.toUpperCase().padEnd(5)
      const route = entry.context?.route ? `[${entry.context.route}]` : ''
      const contextStr = entry.context
        ? Object.entries(entry.context)
            .filter(([key]) => key !== 'route')
            .map(([key, val]) => `${key}=${JSON.stringify(val)}`)
            .join(' ')
        : ''

      let output = `${timestamp} ${level} ${route} ${entry.message}`
      if (contextStr) output += ` ${contextStr}`
      if (entry.error) {
        output += `\n  Error: ${entry.error.name}: ${entry.error.message}`
        if (entry.error.stack) {
          output += `\n${entry.error.stack}`
        }
      }
      return output
    } else {
      return JSON.stringify(entry)
    }
  }

  /**
   * Write log entry to appropriate output
   */
  private write(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      }
    }

    const formatted = this.formatLog(entry)

    switch (level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(formatted)
        }
        break
      case 'info':
        console.info(formatted)
        break
      case 'warn':
        console.warn(formatted)
        break
      case 'error':
        console.error(formatted)
        break
    }
  }

  /**
   * Log debug message (development only)
   */
  debug(message: string, context?: LogContext): void {
    this.write('debug', message, context)
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    this.write('info', message, context)
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.write('warn', message, context)
  }

  /**
   * Log error message
   */
  error(message: string, context?: LogContext, error?: Error): void {
    this.write('error', message, context, error)
  }

  /**
   * Create a child logger with preset context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger()
    const originalWrite = childLogger.write.bind(childLogger)

    childLogger.write = (level: LogLevel, message: string, childContext?: LogContext, error?: Error) => {
      const mergedContext = { ...context, ...childContext }
      originalWrite(level, message, mergedContext, error)
    }

    return childLogger
  }
}

export const logger = new Logger()

/**
 * Create a route-specific logger with preset context
 */
export function createRouteLogger(route: string, request?: Request): Logger {
  const context: LogContext = { route }

  if (request) {
    context.method = request.method
    context.url = request.url
  }

  return logger.child(context)
}
