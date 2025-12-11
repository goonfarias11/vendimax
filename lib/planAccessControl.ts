// lib/planAccessControl.ts
// Control de acceso basado en el plan de suscripción del negocio

import { prisma } from './prisma'
import { getCachedPlanFeatures, setCachedPlanFeatures, invalidatePlanFeaturesCache } from './cachePlanFeatures'

export interface PlanFeatures {
  // Límites
  maxUsers: number | null  // null = ilimitado
  maxProducts: number | null
  maxSales: number | null
  
  // Características habilitadas
  hasInvoicing: boolean           // Facturación electrónica AFIP
  hasMultiBranch: boolean         // Múltiples sucursales
  hasAdvancedReports: boolean     // Reportes avanzados
  hasAPI: boolean                 // Acceso a API
  hasExport: boolean              // Exportación avanzada
  hasBackups: boolean             // Backups automáticos
  
  // Addons
  hasMercadoLibreIntegration: boolean
  hasOnlineStore: boolean
  hasAdvancedAnalytics: boolean
}

/**
 * Obtener características del plan de un negocio
 * Con cache en memoria para reducir consultas a BD
 */
export async function getBusinessPlanFeatures(businessId: string): Promise<PlanFeatures | null> {
  // Intentar obtener desde cache
  const cached = getCachedPlanFeatures(businessId)
  if (cached) {
    return cached
  }

  // Si no está en cache, consultar BD
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      subscriptionARS: {
        include: {
          plan: true,
          subscriptionAddons: {
            include: {
              addon: true
            }
          }
        }
      }
    }
  })

  if (!business || !business.subscriptionARS) {
    // Si no tiene suscripción ARS, retornar plan FREE por defecto
    return {
      maxUsers: 1,
      maxProducts: 100,
      maxSales: 50,
      hasInvoicing: false,
      hasMultiBranch: false,
      hasAdvancedReports: false,
      hasAPI: false,
      hasExport: false,
      hasBackups: false,
      hasMercadoLibreIntegration: false,
      hasOnlineStore: false,
      hasAdvancedAnalytics: false
    }
  }

  const sub = business.subscriptionARS
  const plan = sub.plan

  // Verificar addons activos
  const activeAddons = sub.subscriptionAddons.filter(sa => sa.isActive)
  const addonSlugs = activeAddons.map(sa => sa.addon.slug)

  // Determinar características según el plan
  let features: PlanFeatures = {
    maxUsers: plan.maxUsers,
    maxProducts: plan.maxProducts,
    maxSales: plan.maxSales,
    hasInvoicing: false,
    hasMultiBranch: false,
    hasAdvancedReports: false,
    hasAPI: false,
    hasExport: false,
    hasBackups: false,
    hasMercadoLibreIntegration: addonSlugs.includes('mercadolibre'),
    hasOnlineStore: addonSlugs.includes('tienda-online'),
    hasAdvancedAnalytics: addonSlugs.includes('analisis-avanzado')
  }

  // Características según el plan
  switch (plan.slug) {
    case 'emprendedor':
      // Plan básico, solo lo esencial
      features.hasExport = false
      break
      
    case 'pyme':
      // Plan intermedio
      features.hasInvoicing = true
      features.hasMultiBranch = true
      features.hasAdvancedReports = true
      features.hasExport = true
      break
      
    case 'full':
      // Plan completo
      features.hasInvoicing = true
      features.hasMultiBranch = true
      features.hasAdvancedReports = true
      features.hasAPI = true
      features.hasExport = true
      features.hasBackups = true
      break
  }

  // Guardar en cache
  setCachedPlanFeatures(businessId, features)

  return features
}

/**
 * Verificar si un negocio tiene acceso a una característica
 */
export async function checkFeatureAccess(
  businessId: string,
  feature: keyof PlanFeatures
): Promise<boolean> {
  const features = await getBusinessPlanFeatures(businessId)
  if (!features) return false
  
  const value = features[feature]
  return typeof value === 'boolean' ? value : true
}

/**
 * Verificar límite de usuarios
 */
export async function checkUserLimit(businessId: string): Promise<{ 
  allowed: boolean
  current: number
  limit: number | null
}> {
  const features = await getBusinessPlanFeatures(businessId)
  if (!features) {
    return { allowed: false, current: 0, limit: 0 }
  }
  
  const currentUsers = await prisma.user.count({
    where: { businessId }
  })

  return {
    allowed: features.maxUsers === null || currentUsers < features.maxUsers,
    current: currentUsers,
    limit: features.maxUsers
  }
}

/**
 * Verificar límite de productos
 */
export async function checkProductLimit(businessId: string): Promise<{
  allowed: boolean
  current: number
  limit: number | null
}> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { users: true }
  })

  if (!business || business.users.length === 0) {
    return { allowed: false, current: 0, limit: 0 }
  }

  const features = await getBusinessPlanFeatures(businessId)
  if (!features) {
    return { allowed: false, current: 0, limit: 0 }
  }
  
  const currentProducts = await prisma.product.count()

  return {
    allowed: features.maxProducts === null || currentProducts < features.maxProducts,
    current: currentProducts,
    limit: features.maxProducts
  }
}

/**
 * Verificar límite de ventas mensuales
 */
export async function checkSalesLimit(businessId: string): Promise<{
  allowed: boolean
  current: number
  limit: number | null
}> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { users: true }
  })

  if (!business || business.users.length === 0) {
    return { allowed: false, current: 0, limit: 0 }
  }

  const features = await getBusinessPlanFeatures(businessId)
  if (!features) {
    return { allowed: false, current: 0, limit: 0 }
  }
  
  // Contar ventas del mes actual
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const currentSales = await prisma.sale.count({
    where: {
      userId: {
        in: business.users.map(u => u.id)
      },
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }
  })

  return {
    allowed: features.maxSales === null || currentSales < features.maxSales,
    current: currentSales,
    limit: features.maxSales
  }
}

/**
 * Middleware para verificar acceso a una característica
 */
export function requireFeature(feature: keyof PlanFeatures) {
  return async (businessId: string) => {
    const hasAccess = await checkFeatureAccess(businessId, feature)
    
    if (!hasAccess) {
      throw new Error(
        `Tu plan actual no incluye esta funcionalidad. Actualizá tu suscripción para acceder.`
      )
    }
    
    return true
  }
}

/**
 * Obtener información de upgrade recomendado
 */
/**
 * Obtener recomendación de upgrade automática
 * Analiza el uso actual y sugiere el mejor plan
 */
export async function getUpgradeRecommendation(businessId: string): Promise<{
  shouldUpgrade: boolean
  reasons: string[]
  recommendedPlan: string | null
  currentPlan: string | null
  benefits: string[]
  urgency: 'low' | 'medium' | 'high'
}> {
  const reasons: string[] = []
  const benefits: string[] = []
  let recommendedPlan: string | null = null
  let urgency: 'low' | 'medium' | 'high' = 'low'

  // Obtener plan actual
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      subscriptionARS: {
        include: { plan: true }
      }
    }
  })

  const currentPlan = business?.subscriptionARS?.plan.slug || null

  // Verificar límites
  const userCheck = await checkUserLimit(businessId)
  const productCheck = await checkProductLimit(businessId)
  const salesCheck = await checkSalesLimit(businessId)

  // Detectar límites excedidos (urgencia alta)
  if (!userCheck.allowed) {
    reasons.push(`Superaste el límite de usuarios (${userCheck.current}/${userCheck.limit})`)
    urgency = 'high'
    
    if (currentPlan === 'emprendedor') {
      recommendedPlan = 'pyme'
      benefits.push('Hasta 5 usuarios')
    } else if (currentPlan === 'pyme') {
      recommendedPlan = 'full'
      benefits.push('Usuarios ilimitados')
    }
  }

  if (!productCheck.allowed) {
    reasons.push(`Superaste el límite de productos (${productCheck.current}/${productCheck.limit})`)
    urgency = 'high'
    
    if (currentPlan === 'emprendedor') {
      recommendedPlan = 'pyme'
      benefits.push('Hasta 2000 productos')
    } else if (currentPlan === 'pyme') {
      recommendedPlan = 'full'
      benefits.push('Productos ilimitados')
    }
  }

  if (!salesCheck.allowed) {
    reasons.push(`Superaste el límite de ventas del mes (${salesCheck.current}/${salesCheck.limit})`)
    urgency = 'high'
    
    if (currentPlan === 'emprendedor') {
      recommendedPlan = 'pyme'
      benefits.push('Hasta 1000 ventas/mes')
    } else if (currentPlan === 'pyme') {
      recommendedPlan = 'full'
      benefits.push('Ventas ilimitadas')
    }
  }

  // Detectar cercanía a límites - 80% (urgencia media)
  if (urgency !== 'high') {
    if (userCheck.limit && userCheck.current >= userCheck.limit * 0.8) {
      reasons.push(`Estás usando ${Math.round((userCheck.current / userCheck.limit) * 100)}% de tu límite de usuarios`)
      urgency = 'medium'
      
      if (currentPlan === 'emprendedor') {
        recommendedPlan = 'pyme'
        benefits.push('Más usuarios disponibles (hasta 5)')
      }
    }

    if (productCheck.limit && productCheck.current >= productCheck.limit * 0.8) {
      reasons.push(`Estás usando ${Math.round((productCheck.current / productCheck.limit) * 100)}% de tu límite de productos`)
      urgency = urgency === 'medium' ? 'medium' : 'medium'
      
      if (currentPlan === 'emprendedor') {
        recommendedPlan = 'pyme'
        benefits.push('Más productos disponibles (hasta 2000)')
      }
    }

    if (salesCheck.limit && salesCheck.current >= salesCheck.limit * 0.8) {
      reasons.push(`Estás usando ${Math.round((salesCheck.current / salesCheck.limit) * 100)}% de tu límite de ventas mensuales`)
      urgency = urgency === 'medium' ? 'medium' : 'medium'
      
      if (currentPlan === 'emprendedor') {
        recommendedPlan = 'pyme'
        benefits.push('Más ventas mensuales (hasta 1000)')
      }
    }
  }

  // Verificar uso de funcionalidades avanzadas
  const features = await getBusinessPlanFeatures(businessId)
  
  if (features && currentPlan === 'emprendedor') {
    if (!features.hasInvoicing) {
      reasons.push('No tenés acceso a facturación electrónica AFIP')
      if (!recommendedPlan) {
        recommendedPlan = 'pyme'
        benefits.push('Facturación electrónica AFIP')
        urgency = 'low'
      }
    }
    
    if (!features.hasMultiBranch && !recommendedPlan) {
      benefits.push('Múltiples sucursales')
    }
  }

  if (currentPlan === 'pyme' && features) {
    if (!features.hasAPI) benefits.push('Acceso a API REST')
    if (!features.hasBackups) benefits.push('Backups automáticos')

    if (benefits.length > 0 && !recommendedPlan) {
      recommendedPlan = 'full'
      urgency = 'low'
    }
  }

  // Beneficios generales del plan recomendado
  if (recommendedPlan === 'pyme' && currentPlan === 'emprendedor') {
    benefits.push('Reportes avanzados', 'Exportación de datos')
  }

  if (recommendedPlan === 'full') {
    benefits.push('Soporte prioritario', 'Todas las funcionalidades')
  }

  return {
    shouldUpgrade: reasons.length > 0,
    reasons,
    recommendedPlan,
    currentPlan,
    benefits,
    urgency
  }
}

export default {
  getBusinessPlanFeatures,
  checkFeatureAccess,
  checkUserLimit,
  checkProductLimit,
  checkSalesLimit,
  requireFeature,
  getUpgradeRecommendation
}
