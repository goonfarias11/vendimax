// lib/cachePlanFeatures.ts
// Sistema de cache en memoria para features de planes
// Evita consultas repetitivas a la base de datos

interface PlanFeatures {
  maxUsers: number | null
  maxProducts: number | null
  maxSales: number | null
  hasInvoicing: boolean
  hasMultiBranch: boolean
  hasAdvancedReports: boolean
  hasAPI: boolean
  hasExport: boolean
  hasBackups: boolean
  hasMercadoLibreIntegration: boolean
  hasOnlineStore: boolean
  hasAdvancedAnalytics: boolean
}

interface CacheEntry {
  features: PlanFeatures
  timestamp: number
}

// Cache en memoria usando Map
const featuresCache = new Map<string, CacheEntry>()

// Tiempo de vida del cache: 5 minutos
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos en milisegundos

/**
 * Obtener features del plan desde cache
 * Si no existe o expiró, devuelve null
 */
export function getCachedPlanFeatures(businessId: string): PlanFeatures | null {
  const cached = featuresCache.get(businessId)
  
  if (!cached) {
    return null
  }

  // Verificar si expiró
  const now = Date.now()
  const isExpired = now - cached.timestamp > CACHE_TTL

  if (isExpired) {
    // Eliminar entrada expirada
    featuresCache.delete(businessId)
    return null
  }

  return cached.features
}

/**
 * Guardar features en cache
 */
export function setCachedPlanFeatures(businessId: string, features: PlanFeatures): void {
  featuresCache.set(businessId, {
    features,
    timestamp: Date.now()
  })
}

/**
 * Invalidar cache de un negocio específico
 * Útil cuando se actualiza la suscripción
 */
export function invalidatePlanFeaturesCache(businessId: string): void {
  featuresCache.delete(businessId)
}

/**
 * Invalidar todo el cache
 * Útil para mantenimiento o limpieza
 */
export function invalidateAllPlanFeaturesCache(): void {
  featuresCache.clear()
}

/**
 * Obtener estadísticas del cache
 */
export function getCacheStats() {
  const now = Date.now()
  let activeEntries = 0
  let expiredEntries = 0

  featuresCache.forEach((entry) => {
    const isExpired = now - entry.timestamp > CACHE_TTL
    if (isExpired) {
      expiredEntries++
    } else {
      activeEntries++
    }
  })

  return {
    totalEntries: featuresCache.size,
    activeEntries,
    expiredEntries,
    cacheTTL: CACHE_TTL
  }
}

/**
 * Limpiar entradas expiradas del cache
 * Ejecutar periódicamente para liberar memoria
 */
export function cleanExpiredCacheEntries(): number {
  const now = Date.now()
  let cleaned = 0

  featuresCache.forEach((entry, key) => {
    const isExpired = now - entry.timestamp > CACHE_TTL
    if (isExpired) {
      featuresCache.delete(key)
      cleaned++
    }
  })

  return cleaned
}

// Auto-limpieza cada 10 minutos
if (typeof window === 'undefined') {
  // Solo en servidor
  setInterval(() => {
    const cleaned = cleanExpiredCacheEntries()
    if (cleaned > 0) {
      console.log(`🧹 Cache limpiado: ${cleaned} entradas expiradas eliminadas`)
    }
  }, 10 * 60 * 1000) // 10 minutos
}
