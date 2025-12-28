/**
 * Sistema Centralizado de Control de Límites por Plan
 * 
 * Este archivo es la ÚNICA fuente de verdad para:
 * - Límites de cada plan
 * - Validación de acceso a características
 * - Verificación de límites
 */

import { prisma } from '@/lib/prisma'

export interface PlanLimits {
  maxUsers: number | null
  maxProducts: number | null
  maxSales: number | null
  maxLocations: number | null
  hasAdvancedReports: boolean
  hasIntegrations: boolean
  hasCurrentAccounts: boolean
  hasAPI: boolean
  supportLevel: string
}

export interface UsageStats {
  users: number
  products: number
  salesThisMonth: number
  locations: number
}

export interface LimitCheckResult {
  allowed: boolean
  current: number
  limit: number | null
  percentage: number
  message: string
}

/**
 * Obtener los límites del plan activo de un negocio
 */
export async function getPlanLimits(businessId: string): Promise<PlanLimits | null> {
  const subscription = await prisma.subscriptionARS.findUnique({
    where: { businessId },
    include: { plan: true }
  })

  if (!subscription || !subscription.plan) {
    // Plan gratuito/demo por defecto (límites del plan Básico)
    return {
      maxUsers: 3,
      maxProducts: 500,
      maxSales: 1000,
      maxLocations: 1,
      hasAdvancedReports: false,
      hasIntegrations: false,
      hasCurrentAccounts: false,
      hasAPI: false,
      supportLevel: 'email'
    }
  }

  return {
    maxUsers: subscription.plan.maxUsers,
    maxProducts: subscription.plan.maxProducts,
    maxSales: subscription.plan.maxSales,
    maxLocations: subscription.plan.maxLocations,
    hasAdvancedReports: subscription.plan.hasAdvancedReports,
    hasIntegrations: subscription.plan.hasIntegrations,
    hasCurrentAccounts: subscription.plan.hasCurrentAccounts,
    hasAPI: subscription.plan.hasAPI,
    supportLevel: subscription.plan.supportLevel
  }
}

/**
 * Obtener estadísticas de uso actual del negocio
 */
export async function getUsageStats(businessId: string): Promise<UsageStats> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const [users, products, salesThisMonth] = await Promise.all([
    prisma.user.count({
      where: { businessId, isActive: true }
    }),
    prisma.product.count({
      where: { businessId, isActive: true }
    }),
    prisma.sale.count({
      where: {
        businessId,
        status: 'COMPLETADO',
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    })
  ])

  // TODO: Cuando se agregue soporte multi-ubicación, contar ubicaciones reales
  const locations = 1

  return {
    users,
    products,
    salesThisMonth,
    locations
  }
}

/**
 * Verificar si se puede crear un nuevo usuario
 */
export async function canCreateUser(businessId: string): Promise<LimitCheckResult> {
  const [limits, usage] = await Promise.all([
    getPlanLimits(businessId),
    getUsageStats(businessId)
  ])

  if (!limits) {
    return {
      allowed: false,
      current: usage.users,
      limit: null,
      percentage: 0,
      message: 'No se pudo verificar el plan de suscripción'
    }
  }

  // Plan Full: sin límite
  if (limits.maxUsers === null) {
    return {
      allowed: true,
      current: usage.users,
      limit: null,
      percentage: 0,
      message: 'Usuarios ilimitados'
    }
  }

  const allowed = usage.users < limits.maxUsers
  const percentage = (usage.users / limits.maxUsers) * 100

  return {
    allowed,
    current: usage.users,
    limit: limits.maxUsers,
    percentage,
    message: allowed 
      ? `${usage.users} de ${limits.maxUsers} usuarios usados`
      : `Límite alcanzado: ${usage.users}/${limits.maxUsers} usuarios. Actualiza tu plan para agregar más.`
  }
}

/**
 * Verificar si se puede crear un nuevo producto
 */
export async function canCreateProduct(businessId: string): Promise<LimitCheckResult> {
  const [limits, usage] = await Promise.all([
    getPlanLimits(businessId),
    getUsageStats(businessId)
  ])

  if (!limits) {
    return {
      allowed: false,
      current: usage.products,
      limit: null,
      percentage: 0,
      message: 'No se pudo verificar el plan de suscripción'
    }
  }

  if (limits.maxProducts === null) {
    return {
      allowed: true,
      current: usage.products,
      limit: null,
      percentage: 0,
      message: 'Productos ilimitados'
    }
  }

  const allowed = usage.products < limits.maxProducts
  const percentage = (usage.products / limits.maxProducts) * 100

  return {
    allowed,
    current: usage.products,
    limit: limits.maxProducts,
    percentage,
    message: allowed
      ? `${usage.products} de ${limits.maxProducts} productos usados`
      : `Límite alcanzado: ${usage.products}/${limits.maxProducts} productos. Actualiza tu plan para agregar más.`
  }
}

/**
 * Verificar si se puede registrar una nueva venta
 */
export async function canCreateSale(businessId: string): Promise<LimitCheckResult> {
  const [limits, usage] = await Promise.all([
    getPlanLimits(businessId),
    getUsageStats(businessId)
  ])

  if (!limits) {
    return {
      allowed: false,
      current: usage.salesThisMonth,
      limit: null,
      percentage: 0,
      message: 'No se pudo verificar el plan de suscripción'
    }
  }

  if (limits.maxSales === null) {
    return {
      allowed: true,
      current: usage.salesThisMonth,
      limit: null,
      percentage: 0,
      message: 'Ventas ilimitadas'
    }
  }

  const allowed = usage.salesThisMonth < limits.maxSales
  const percentage = (usage.salesThisMonth / limits.maxSales) * 100

  return {
    allowed,
    current: usage.salesThisMonth,
    limit: limits.maxSales,
    percentage,
    message: allowed
      ? `${usage.salesThisMonth} de ${limits.maxSales} ventas este mes`
      : `Límite mensual alcanzado: ${usage.salesThisMonth}/${limits.maxSales} ventas. Actualiza tu plan o espera al próximo mes.`
  }
}

/**
 * Verificar si tiene acceso a reportes avanzados
 */
export async function hasAdvancedReports(businessId: string): Promise<boolean> {
  const limits = await getPlanLimits(businessId)
  return limits?.hasAdvancedReports ?? false
}

/**
 * Verificar si tiene acceso a integraciones
 */
export async function hasIntegrations(businessId: string): Promise<boolean> {
  const limits = await getPlanLimits(businessId)
  return limits?.hasIntegrations ?? false
}

/**
 * Verificar si tiene acceso a cuenta corriente de clientes
 */
export async function hasCurrentAccounts(businessId: string): Promise<boolean> {
  const limits = await getPlanLimits(businessId)
  return limits?.hasCurrentAccounts ?? false
}

/**
 * Verificar si tiene acceso a la API
 */
export async function hasAPIAccess(businessId: string): Promise<boolean> {
  const limits = await getPlanLimits(businessId)
  return limits?.hasAPI ?? false
}

/**
 * Obtener información completa del plan y uso
 */
export async function getPlanSummary(businessId: string) {
  const [limits, usage, subscription] = await Promise.all([
    getPlanLimits(businessId),
    getUsageStats(businessId),
    prisma.subscriptionARS.findUnique({
      where: { businessId },
      include: { plan: true }
    })
  ])

  if (!limits || !subscription) {
    return null
  }

  const usersPercentage = limits.maxUsers ? (usage.users / limits.maxUsers) * 100 : 0
  const productsPercentage = limits.maxProducts ? (usage.products / limits.maxProducts) * 100 : 0
  const salesPercentage = limits.maxSales ? (usage.salesThisMonth / limits.maxSales) * 100 : 0

  return {
    plan: {
      name: subscription.plan.name,
      slug: subscription.plan.slug,
      priceMonthly: Number(subscription.plan.priceMonthly),
      isMostPopular: subscription.plan.isMostPopular
    },
    limits,
    usage,
    percentages: {
      users: Math.round(usersPercentage),
      products: Math.round(productsPercentage),
      sales: Math.round(salesPercentage)
    },
    warnings: {
      users: usersPercentage >= 80,
      products: productsPercentage >= 80,
      sales: salesPercentage >= 80
    },
    needsUpgrade: usersPercentage >= 100 || productsPercentage >= 100 || salesPercentage >= 100
  }
}

/**
 * Obtener mensaje de sugerencia de upgrade
 */
export function getUpgradeMessage(resource: 'users' | 'products' | 'sales', current: number, limit: number): string {
  const percentage = (current / limit) * 100

  if (percentage >= 100) {
    return `Alcanzaste el límite de ${resource}. Actualiza tu plan para continuar.`
  }

  if (percentage >= 80) {
    return `Estás usando el ${Math.round(percentage)}% de tu límite de ${resource}. Considera actualizar tu plan.`
  }

  return ''
}
