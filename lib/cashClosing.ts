import { Prisma } from "@prisma/client"

// ============================================
// TIPOS Y INTERFACES
// ============================================

export interface SalesByPaymentMethod {
  cash: number
  card: number
  transfer: number
  mixed: number
  other: number
}

export interface CashClosingSummary {
  from: Date
  to: Date
  totalCash: number
  totalCard: number
  totalTransfer: number
  totalMixedPayments: number
  totalGeneral: number
  totalGrossSales: number
  totalNetSales: number
  totalRefunds: number
  totalInvoiced: number
  totalNotInvoiced: number
  salesCount: number
  refundsCount: number
  salesByMethod: SalesByPaymentMethod
  cashExpected: number
  cashCounted?: number
  cashDifference?: number
}

export interface ClosingCalculationResult {
  summary: CashClosingSummary
  unclosedSales: Array<{
    id: string
    total: number
    paymentMethod: string
    createdAt: Date
    hasMixedPayment: boolean
  }>
  refunds: Array<{
    id: string
    refundAmount: number
    createdAt: Date
  }>
}

// ============================================
// FUNCIONES PURAS DE CÁLCULO
// ============================================

/**
 * Clasifica ventas por método de pago y calcula totales
 * Función pura - no tiene efectos secundarios
 */
export function calculateSalesByPaymentMethod(
  sales: Array<{ total: Prisma.Decimal; paymentMethod: string; hasMixedPayment?: boolean }>
): SalesByPaymentMethod {
  const totals: SalesByPaymentMethod = {
    cash: 0,
    card: 0,
    transfer: 0,
    mixed: 0,
    other: 0,
  }

  for (const sale of sales) {
    const amount = Number(sale.total)

    // Si es pago mixto, se contabiliza aparte
    if (sale.hasMixedPayment) {
      totals.mixed += amount
      continue
    }

    switch (sale.paymentMethod) {
      case "EFECTIVO":
        totals.cash += amount
        break
      case "TARJETA_DEBITO":
      case "TARJETA_CREDITO":
        totals.card += amount
        break
      case "TRANSFERENCIA":
      case "QR":
        totals.transfer += amount
        break
      default:
        totals.other += amount
    }
  }

  return totals
}

/**
 * Calcula el total general sumando todos los métodos de pago
 * Función pura
 */
export function calculateGeneralTotal(salesByMethod: SalesByPaymentMethod): number {
  return salesByMethod.cash + salesByMethod.card + salesByMethod.transfer + salesByMethod.mixed + salesByMethod.other
}

/**
 * Calcula el efectivo esperado en caja
 * Función pura
 */
export function calculateExpectedCash(openingAmount: number, cashSales: number, mixedCash: number = 0): number {
  return roundToTwoDecimals(openingAmount + cashSales + mixedCash)
}

/**
 * Calcula la diferencia de efectivo
 * Función pura
 */
export function calculateCashDifference(cashCounted: number, cashExpected: number): number {
  return roundToTwoDecimals(cashCounted - cashExpected)
}

/**
 * Redondea un número a 2 decimales para evitar problemas de precisión
 * Función pura
 */
export function roundToTwoDecimals(num: number): number {
  return Math.round(num * 100) / 100
}

/**
 * Construye el resumen completo del cierre de caja
 * Función pura
 */
export function buildCashClosingSummary(
  from: Date,
  to: Date,
  sales: Array<{ 
    total: Prisma.Decimal
    subtotal: Prisma.Decimal
    paymentMethod: string
    hasMixedPayment?: boolean
  }>,
  refunds: Array<{ refundAmount: Prisma.Decimal }> = [],
  openingAmount: number = 0,
  cashCounted?: number
): CashClosingSummary {
  const salesByMethod = calculateSalesByPaymentMethod(sales)
  const totalGeneral = calculateGeneralTotal(salesByMethod)
  
  // Calcular totales brutos y netos
  const totalGrossSales = sales.reduce((sum, sale) => sum + Number(sale.total), 0)
  const totalNetSales = sales.reduce((sum, sale) => sum + Number(sale.subtotal), 0)
  
  // Calcular total de devoluciones
  const totalRefunds = refunds.reduce((sum, refund) => sum + Number(refund.refundAmount), 0)
  
  // Calcular efectivo esperado (apertura + ventas en efectivo)
  const cashExpected = calculateExpectedCash(openingAmount, salesByMethod.cash)
  
  // Calcular diferencia si se proporcionó el efectivo contado
  const cashDifference = cashCounted !== undefined 
    ? calculateCashDifference(cashCounted, cashExpected) 
    : undefined

  return {
    from,
    to,
    totalCash: roundToTwoDecimals(salesByMethod.cash),
    totalCard: roundToTwoDecimals(salesByMethod.card),
    totalTransfer: roundToTwoDecimals(salesByMethod.transfer),
    totalMixedPayments: roundToTwoDecimals(salesByMethod.mixed),
    totalGeneral: roundToTwoDecimals(totalGeneral),
    totalGrossSales: roundToTwoDecimals(totalGrossSales),
    totalNetSales: roundToTwoDecimals(totalNetSales),
    totalRefunds: roundToTwoDecimals(totalRefunds),
    totalInvoiced: 0, // Se debe calcular externamente
    totalNotInvoiced: 0, // Se debe calcular externamente
    salesCount: sales.length,
    refundsCount: refunds.length,
    salesByMethod,
    cashExpected,
    cashCounted,
    cashDifference,
  }
}

// ============================================
// VALIDACIONES DE NEGOCIO
// ============================================

/**
 * Valida que haya ventas para cerrar
 */
export function validateHasSalesToClose(salesCount: number): { valid: boolean; error?: string } {
  if (salesCount === 0) {
    return {
      valid: false,
      error: "No hay ventas sin cerrar en el período especificado",
    }
  }
  return { valid: true }
}

/**
 * Valida que el rango de fechas sea válido
 */
export function validateDateRange(from: Date, to: Date): { valid: boolean; error?: string } {
  if (to <= from) {
    return {
      valid: false,
      error: "La fecha final debe ser posterior a la fecha inicial",
    }
  }

  const now = new Date()
  if (to > now) {
    return {
      valid: false,
      error: "La fecha final no puede ser futura",
    }
  }

  return { valid: true }
}

/**
 * Valida que los totales sean consistentes
 */
export function validateTotals(
  totalCash: number,
  totalCard: number,
  totalTransfer: number,
  totalGeneral: number
): { valid: boolean; error?: string } {
  const calculated = totalCash + totalCard + totalTransfer
  const difference = Math.abs(calculated - totalGeneral)

  // Permitir una diferencia mínima por redondeo (0.01)
  if (difference > 0.01) {
    return {
      valid: false,
      error: `Inconsistencia en totales. Calculado: ${calculated}, General: ${totalGeneral}`,
    }
  }

  return { valid: true }
}

/**
 * Valida que se requieran observaciones cuando hay diferencia de efectivo
 * @param difference - Diferencia entre efectivo contado y esperado
 * @param notes - Observaciones del cierre
 * @param threshold - Umbral a partir del cual se requieren observaciones (default: 10)
 */
export function validateCashDifference(
  difference: number,
  notes?: string,
  threshold: number = 10
): { valid: boolean; error?: string; requiresNotes: boolean } {
  const absDifference = Math.abs(difference)
  
  if (absDifference === 0) {
    return { valid: true, requiresNotes: false }
  }

  if (absDifference >= threshold && (!notes || notes.trim().length === 0)) {
    return {
      valid: false,
      requiresNotes: true,
      error: `Se requieren observaciones cuando la diferencia es mayor o igual a $${threshold}`,
    }
  }

  return { valid: true, requiresNotes: absDifference >= threshold }
}

/**
 * Valida que no exista un cierre previo para el mismo turno
 */
export function validateNoPreviousClosing(
  cashRegisterId: string,
  existingClosing: boolean
): { valid: boolean; error?: string } {
  if (existingClosing) {
    return {
      valid: false,
      error: "Ya existe un cierre para este turno de caja",
    }
  }
  return { valid: true }
}

// ============================================
// UTILIDADES DE FORMATO
// ============================================

/**
 * Formatea un monto a string con formato de moneda
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount)
}

/**
 * Formatea una fecha para el número de cierre
 */
export function formatClosingNumber(number: number): string {
  return `CJ-${String(number).padStart(6, "0")}`
}

/**
 * Genera un resumen en texto del cierre
 */
export function generateClosingSummaryText(summary: CashClosingSummary, number: number): string {
  const differenceText = summary.cashDifference !== undefined
    ? `
CONTROL DE EFECTIVO:
- Efectivo Esperado: ${formatCurrency(summary.cashExpected)}
- Efectivo Contado:  ${formatCurrency(summary.cashCounted || 0)}
- Diferencia:        ${summary.cashDifference >= 0 ? '+' : ''}${formatCurrency(summary.cashDifference)} ${getDifferenceEmoji(summary.cashDifference)}
`
    : ''

  return `
╔════════════════════════════════════════╗
║   CIERRE DE CAJA ${formatClosingNumber(number).padEnd(16)}║
╚════════════════════════════════════════╝

📅 PERÍODO
   ${summary.from.toLocaleDateString('es-AR')} - ${summary.to.toLocaleDateString('es-AR')}

📊 RESUMEN DE OPERACIONES
   Total de ventas:      ${summary.salesCount}
   Total de devoluciones: ${summary.refundsCount}

💰 VENTAS POR MÉTODO DE PAGO
   Efectivo:            ${formatCurrency(summary.totalCash)}
   Tarjeta:             ${formatCurrency(summary.totalCard)}
   Transferencia:       ${formatCurrency(summary.totalTransfer)}
   Pagos Mixtos:        ${formatCurrency(summary.totalMixedPayments)}
   ${summary.salesByMethod.other > 0 ? `Otros:               ${formatCurrency(summary.salesByMethod.other)}\n   ` : ''}
   ─────────────────────────────────────
   TOTAL BRUTO:         ${formatCurrency(summary.totalGrossSales)}
   TOTAL NETO:          ${formatCurrency(summary.totalNetSales)}

${summary.totalRefunds > 0 ? `
🔄 DEVOLUCIONES
   Total devuelto:      ${formatCurrency(summary.totalRefunds)}
` : ''}
📄 FACTURACIÓN
   Total Facturado:     ${formatCurrency(summary.totalInvoiced)}
   Total No Facturado:  ${formatCurrency(summary.totalNotInvoiced)}
${differenceText}
═══════════════════════════════════════
   TOTAL GENERAL:       ${formatCurrency(summary.totalGeneral)}
═══════════════════════════════════════
`.trim()
}

/**
 * Obtiene un emoji según la diferencia de efectivo
 */
function getDifferenceEmoji(difference: number): string {
  if (difference === 0) return '✅'
  if (Math.abs(difference) < 10) return '⚠️'
  return difference > 0 ? '📈' : '📉'
}
