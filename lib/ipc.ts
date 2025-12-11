// lib/ipc.ts
// Sistema de ajuste automático de precios por IPC (Índice de Precios al Consumidor)

import { prisma } from './prisma'

/**
 * Obtener el último IPC publicado por INDEC
 * Consulta la API oficial de datos abiertos del gobierno argentino
 */
export async function getLatestIPCRate(): Promise<number> {
  try {
    // API oficial de series de tiempo del gobierno argentino
    const apiUrl = 'https://apis.datos.gob.ar/series/api/series/?ids=148.3_INIVELNAL_DICI_M_26&limit=1&format=json'
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`API INDEC error: ${response.status}`)
    }

    const data = await response.json()
    
    // Estructura: { data: [[fecha, valor], ...] }
    if (data.data && data.data.length > 0) {
      const latestData = data.data[data.data.length - 1]
      const ipcValue = latestData[1] // El segundo elemento es el valor
      
      // Calcular variación trimestral (últimos 3 meses)
      // Para simplificar, usamos el valor mensual * 3
      const quarterlyIPC = ipcValue * 3
      
      console.log(`✅ IPC trimestral obtenido del INDEC: ${quarterlyIPC.toFixed(2)}%`)
      
      return Number(quarterlyIPC.toFixed(2))
    }

    console.warn('⚠️ No se pudo obtener IPC del INDEC, usando valor por defecto')
    return 25.5 // Fallback

  } catch (error) {
    console.error('❌ Error al obtener IPC del INDEC:', error)
    console.warn('⚠️ Usando valor IPC por defecto: 25.5%')
    return 25.5 // Fallback en caso de error
  }
}

/**
 * Calcular nuevo precio con ajuste IPC
 */
export function calculateIPCAdjustment(currentPrice: number, ipcRate: number): number {
  return Math.round(currentPrice * (1 + ipcRate / 100))
}

/**
 * Verificar si es momento de aplicar ajuste trimestral
 * Se aplica cada 3 meses (enero, abril, julio, octubre)
 */
export function shouldApplyQuarterlyAdjustment(): boolean {
  const now = new Date()
  const month = now.getMonth() + 1 // 1-12
  const day = now.getDate()

  // Aplicar el primer día de los meses trimestrales
  return (month === 1 || month === 4 || month === 7 || month === 10) && day === 1
}

/**
 * Obtener la fecha del próximo ajuste trimestral
 */
export function getNextAdjustmentDate(): Date {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  let nextMonth: number
  let nextYear = year

  if (month < 4) {
    nextMonth = 4
  } else if (month < 7) {
    nextMonth = 7
  } else if (month < 10) {
    nextMonth = 10
  } else {
    nextMonth = 1
    nextYear = year + 1
  }

  return new Date(nextYear, nextMonth - 1, 1)
}

/**
 * Aplicar ajuste de IPC a todos los planes activos
 */
export async function applyIPCAdjustmentToAllPlans(ipcRate: number, adminUserId: string) {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true }
  })

  const results = []

  for (const plan of plans) {
    const newMonthlyPrice = calculateIPCAdjustment(Number(plan.priceMonthly), ipcRate)
    const newYearlyPrice = calculateIPCAdjustment(Number(plan.priceYearly), ipcRate)

    // Registrar ajuste en historial
    await prisma.priceAdjustment.create({
      data: {
        planId: plan.id,
        previousPrice: plan.priceMonthly,
        newPrice: newMonthlyPrice,
        percentage: ipcRate,
        reason: `Ajuste automático por IPC trimestral (${ipcRate}%)`,
        ipcValue: ipcRate,
        appliedBy: adminUserId,
        notificationSent: false
      }
    })

    // Actualizar precios
    await prisma.subscriptionPlan.update({
      where: { id: plan.id },
      data: {
        priceMonthly: newMonthlyPrice,
        priceYearly: newYearlyPrice
      }
    })

    results.push({
      planId: plan.id,
      planName: plan.name,
      oldMonthly: Number(plan.priceMonthly),
      newMonthly: newMonthlyPrice,
      oldYearly: Number(plan.priceYearly),
      newYearly: newYearlyPrice
    })
  }

  return results
}

/**
 * Aplicar ajuste de IPC a todos los addons activos
 */
export async function applyIPCAdjustmentToAllAddons(ipcRate: number, adminUserId: string) {
  const addons = await prisma.addon.findMany({
    where: { isActive: true }
  })

  const results = []

  for (const addon of addons) {
    const newPrice = calculateIPCAdjustment(Number(addon.priceMonthly), ipcRate)

    // Registrar ajuste
    await prisma.priceAdjustment.create({
      data: {
        addonId: addon.id,
        previousPrice: addon.priceMonthly,
        newPrice: newPrice,
        percentage: ipcRate,
        reason: `Ajuste automático por IPC trimestral (${ipcRate}%)`,
        ipcValue: ipcRate,
        appliedBy: adminUserId,
        notificationSent: false
      }
    })

    // Actualizar precio
    await prisma.addon.update({
      where: { id: addon.id },
      data: {
        priceMonthly: newPrice
      }
    })

    results.push({
      addonId: addon.id,
      addonName: addon.name,
      oldPrice: Number(addon.priceMonthly),
      newPrice: newPrice
    })
  }

  return results
}

/**
 * Enviar notificaciones de ajuste de precio a clientes
 * Se envía 7 días antes de que entre en vigor
 */
export async function notifyClientsOfPriceAdjustment(
  ipcRate: number,
  effectiveDate: Date
) {
  // Obtener todas las suscripciones activas (excepto anuales con precio congelado)
  const subscriptions = await prisma.subscriptionARS.findMany({
    where: {
      status: 'active',
      billingCycle: 'monthly' // Solo las mensuales se ajustan
    },
    include: {
      plan: true,
      business: true
    }
  })

  // Por cada suscripción, enviar notificación
  for (const sub of subscriptions) {
    const currentPrice = Number(sub.priceMonthly)
    const newPrice = calculateIPCAdjustment(currentPrice, ipcRate)

    // TODO: Integrar con servicio de emails (Resend, SendGrid, etc.)
    console.log(`[Notificación] Cliente: ${sub.business.email}`)
    console.log(`  Plan: ${sub.plan.name}`)
    console.log(`  Precio actual: $${currentPrice}`)
    console.log(`  Nuevo precio: $${newPrice}`)
    console.log(`  Entra en vigor: ${effectiveDate.toLocaleDateString('es-AR')}`)

    // Guardar la notificación en la base de datos
    // (si tuviéramos el modelo PriceAdjustmentNotification creado)
  }

  return subscriptions.length
}

/**
 * Verificar suscripciones anuales que están por vencer
 * y que necesitan renovar con el nuevo precio
 */
export async function checkExpiringAnnualSubscriptions() {
  const today = new Date()
  const in30Days = new Date()
  in30Days.setDate(today.getDate() + 30)

  const expiring = await prisma.subscriptionARS.findMany({
    where: {
      status: 'active',
      billingCycle: 'yearly',
      currentPeriodEnd: {
        gte: today,
        lte: in30Days
      }
    },
    include: {
      plan: true,
      business: true
    }
  })

  // Notificar a estos clientes que al renovar pagarán el precio actualizado
  for (const sub of expiring) {
    console.log(`[Renovación Anual] Cliente: ${sub.business.email}`)
    console.log(`  Plan: ${sub.plan.name}`)
    console.log(`  Precio actual (congelado): $${Number(sub.priceYearly)}`)
    console.log(`  Nuevo precio al renovar: $${Number(sub.plan.priceYearly)}`)
    console.log(`  Vence: ${sub.currentPeriodEnd.toLocaleDateString('es-AR')}`)
  }

  return expiring.length
}

/**
 * Función principal para ejecutar el proceso de ajuste trimestral
 * Debe ser ejecutada por un cron job o tarea programada
 */
export async function executeQuarterlyIPCAdjustment(adminUserId: string) {
  try {
    // 1. Obtener el IPC actual
    const ipcRate = await getLatestIPCRate()

    // 2. Calcular fecha efectiva (7 días después)
    const effectiveDate = new Date()
    effectiveDate.setDate(effectiveDate.getDate() + 7)

    // 3. Aplicar ajustes a planes y addons
    const planResults = await applyIPCAdjustmentToAllPlans(ipcRate, adminUserId)
    const addonResults = await applyIPCAdjustmentToAllAddons(ipcRate, adminUserId)

    // 4. Enviar notificaciones a clientes
    const notifiedCount = await notifyClientsOfPriceAdjustment(ipcRate, effectiveDate)

    // 5. Verificar suscripciones anuales próximas a vencer
    const expiringCount = await checkExpiringAnnualSubscriptions()

    return {
      success: true,
      ipcRate,
      effectiveDate,
      plansAdjusted: planResults.length,
      addonsAdjusted: addonResults.length,
      clientsNotified: notifiedCount,
      expiringAnnual: expiringCount,
      details: {
        plans: planResults,
        addons: addonResults
      }
    }
  } catch (error) {
    console.error('Error al ejecutar ajuste trimestral de IPC:', error)
    throw error
  }
}

export default {
  getLatestIPCRate,
  calculateIPCAdjustment,
  shouldApplyQuarterlyAdjustment,
  getNextAdjustmentDate,
  applyIPCAdjustmentToAllPlans,
  applyIPCAdjustmentToAllAddons,
  notifyClientsOfPriceAdjustment,
  checkExpiringAnnualSubscriptions,
  executeQuarterlyIPCAdjustment
}
