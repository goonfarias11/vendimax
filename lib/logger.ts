type LogLevel = 'info' | 'warn' | 'error' | 'debug'

class Logger {
  private isDev = process.env.NODE_ENV === 'development'

  private sanitize(data: unknown): unknown {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return data
    
    const sanitized: Record<string, unknown> = { ...(data as Record<string, unknown>) }
    const sensitiveKeys = ['password', 'passwordHash', 'token', 'secret', 'apiKey', 'creditCard']
    
    sensitiveKeys.forEach(key => {
      if (key in sanitized) {
        sanitized[key] = '[REDACTED]'
      }
    })
    
    return sanitized
  }

  private log(level: LogLevel, message: string, ...args: unknown[]) {
    if (!this.isDev && level === 'debug') return
    if (!this.isDev && level === 'info') return // No info en producción

    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`
    
    // Sanitizar argumentos
    const sanitizedArgs = args.map(arg => this.sanitize(arg))

    switch (level) {
      case 'error':
        console.error(prefix, message, ...sanitizedArgs)
        break
      case 'warn':
        console.warn(prefix, message, ...sanitizedArgs)
        break
      default:
        console.log(prefix, message, ...sanitizedArgs)
    }
  }

  info(message: string, ...args: unknown[]) {
    this.log('info', message, ...args)
  }

  warn(message: string, ...args: unknown[]) {
    this.log('warn', message, ...args)
  }

  error(message: string, ...args: unknown[]) {
    this.log('error', message, ...args)
  }

  debug(message: string, ...args: unknown[]) {
    this.log('debug', message, ...args)
  }
}

export const logger = new Logger()
