// Rate Limiting simple en memoria (para desarrollo)
// En producción, usar Upstash Redis o similar

type RateLimitEntry = {
  count: number
  resetTime: number
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Limpiar entradas expiradas cada minuto
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.store.entries()) {
        if (now > entry.resetTime) {
          this.store.delete(key)
        }
      }
    }, 60000)
  }

  async limit(
    identifier: string,
    maxRequests: number = 30,
    windowMs: number = 60000 // 1 minuto por defecto
  ): Promise<{
    success: boolean
    limit: number
    remaining: number
    reset: Date
  }> {
    const now = Date.now()
    const entry = this.store.get(identifier)

    if (!entry || now > entry.resetTime) {
      // Nueva ventana
      const resetTime = now + windowMs
      this.store.set(identifier, { count: 1, resetTime })
      
      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests - 1,
        reset: new Date(resetTime)
      }
    }

    // Ventana existente
    entry.count++
    
    if (entry.count > maxRequests) {
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        reset: new Date(entry.resetTime)
      }
    }

    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - entry.count,
      reset: new Date(entry.resetTime)
    }
  }

  cleanup() {
    clearInterval(this.cleanupInterval)
  }
}

// Instancia singleton
const rateLimiter = new RateLimiter()

// Rate limiters específicos
export const authRateLimit = (identifier: string) => 
  rateLimiter.limit(identifier, 5, 15 * 60 * 1000) // 5 intentos por 15 min

export const apiRateLimit = (identifier: string) => 
  rateLimiter.limit(identifier, 30, 60 * 1000) // 30 requests por minuto

export const salesRateLimit = (identifier: string) => 
  rateLimiter.limit(identifier, 10, 60 * 1000) // 10 ventas por minuto

export default rateLimiter
