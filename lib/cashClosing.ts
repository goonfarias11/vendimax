import { Prisma } from "@prisma/client"

// ============================================
// TIPOS Y INTERFACES
// ============================================

export interface SalesByPaymentMethod {
  cash: number
  card: number
  transfer: number
  other: number
}

export interface CashClosingSummary {
  from: Date
  to: Date
  totalCash: number
  totalCard: number
  totalTransfer: number
  totalGeneral: number
  salesCount: number
  salesByMethod: SalesByPaymentMethod
}

export interface ClosingCalculationResult {
  summary: CashClosingSummary
  unclosedSales: Array<{
    id: string
    total: number
    paymentMethod: string
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
  sales: Array<{ total: Prisma.Decimal; paymentMethod: string }>
): SalesByPaymentMethod {
  const totals: SalesByPaymentMethod = {
    cash: 0,
    card: 0,
    transfer: 0,
    other: 0,
  }

  for (const sale of sales) {
    const amount = Number(sale.total)

    switch (sale.paymentMethod) {
      case "EFECTIVO":
        totals.cash += amount
        break
      case "TARJETA_DEBITO":
      case "TARJETA_CREDITO":
        totals.card += amount
        break
      case "TRANSFERENCIA":
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
  return salesByMethod.cash + salesByMethod.card + salesByMethod.transfer + salesByMethod.other
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
  sales: Array<{ total: Prisma.Decimal; paymentMethod: string }>
): CashClosingSummary {
  const salesByMethod = calculateSalesByPaymentMethod(sales)
  const totalGeneral = calculateGeneralTotal(salesByMethod)

  return {
    from,
    to,
    totalCash: roundToTwoDecimals(salesByMethod.cash),
    totalCard: roundToTwoDecimals(salesByMethod.card),
    totalTransfer: roundToTwoDecimals(salesByMethod.transfer),
    totalGeneral: roundToTwoDecimals(totalGeneral),
    salesCount: sales.length,
    salesByMethod,
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
  return `
CIERRE DE CAJA ${formatClosingNumber(number)}
================================================
Período: ${summary.from.toLocaleDateString()} - ${summary.to.toLocaleDateString()}
Total de ventas: ${summary.salesCount}

TOTALES POR MÉTODO DE PAGO:
- Efectivo:       ${formatCurrency(summary.totalCash)}
- Tarjeta:        ${formatCurrency(summary.totalCard)}
- Transferencia:  ${formatCurrency(summary.totalTransfer)}

TOTAL GENERAL:    ${formatCurrency(summary.totalGeneral)}
================================================
`.trim()
}
