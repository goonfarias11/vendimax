// lib/mercadopago.ts
// Integración con MercadoPago para suscripciones recurrentes en ARS

import { Payment, MercadoPagoConfig } from 'mercadopago'

// Configurar el cliente de MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-placeholder',
  options: {
    timeout: 5000
  }
})

const payment = new Payment(client)

export interface CreatePreApprovalParams {
  reason: string // Nombre del plan
  autoRecurring: {
    frequency: number // Meses entre cargos (1 = mensual)
    frequencyType: 'months'
    transactionAmount: number // Precio en ARS
    currencyId: 'ARS'
  }
  backUrl: string
  payer_email: string
  external_reference: string // ID de la suscripción
  status?: 'pending' | 'authorized' | 'paused' | 'cancelled'
}

/**
 * Crear una suscripción recurrente en MercadoPago
 * @see https://www.mercadopago.com.ar/developers/es/reference/subscriptions/_preapproval/post
 */
export async function createPreApproval(params: CreatePreApprovalParams) {
  try {
    // Usar la API de preapproval (suscripciones)
    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
      },
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`MercadoPago error: ${error}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error al crear suscripción en MercadoPago:', error)
    throw error
  }
}

/**
 * Obtener información de una suscripción
 */
export async function getPreApproval(preapprovalId: string) {
  try {
    const response = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
      }
    })

    if (!response.ok) {
      throw new Error(`Error al obtener suscripción: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error al obtener suscripción:', error)
    throw error
  }
}

/**
 * Cancelar una suscripción
 */
export async function cancelPreApproval(preapprovalId: string) {
  try {
    const response = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        status: 'cancelled'
      })
    })

    if (!response.ok) {
      throw new Error(`Error al cancelar suscripción: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error al cancelar suscripción:', error)
    throw error
  }
}

/**
 * Pausar una suscripción
 */
export async function pausePreApproval(preapprovalId: string) {
  try {
    const response = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        status: 'paused'
      })
    })

    if (!response.ok) {
      throw new Error(`Error al pausar suscripción: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error al pausar suscripción:', error)
    throw error
  }
}

/**
 * Reactivar una suscripción pausada
 */
export async function resumePreApproval(preapprovalId: string) {
  try {
    const response = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        status: 'authorized'
      })
    })

    if (!response.ok) {
      throw new Error(`Error al reactivar suscripción: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error al reactivar suscripción:', error)
    throw error
  }
}

/**
 * Crear un pago único (para Setup Fee o pagos anuales)
 */
export async function createPayment(params: {
  transaction_amount: number
  description: string
  payment_method_id: string
  payer: {
    email: string
  }
  external_reference?: string
  notification_url?: string
}) {
  try {
    const result = await payment.create({
      body: params
    })
    return result
  } catch (error) {
    console.error('Error al crear pago:', error)
    throw error
  }
}

/**
 * Obtener información de un pago
 */
export async function getPayment(paymentId: string) {
  try {
    const result = await payment.get({ id: paymentId })
    return result
  } catch (error) {
    console.error('Error al obtener pago:', error)
    throw error
  }
}

/**
 * Calcular IVA (21%)
 */
export function calculateTax(amount: number, taxRate: number = 21): number {
  return Math.round(amount * (taxRate / 100))
}

/**
 * Calcular total con IVA
 */
export function calculateTotal(amount: number, taxRate: number = 21): number {
  return amount + calculateTax(amount, taxRate)
}

/**
 * Formatear precio ARS
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0
  }).format(amount)
}

/**
 * Verificar si las credenciales de MercadoPago están configuradas
 */
export function isMercadoPagoConfigured(): boolean {
  return Boolean(
    process.env.MERCADOPAGO_ACCESS_TOKEN &&
    process.env.MERCADOPAGO_ACCESS_TOKEN !== 'TEST-placeholder'
  )
}

export default {
  createPreApproval,
  getPreApproval,
  cancelPreApproval,
  pausePreApproval,
  resumePreApproval,
  createPayment,
  getPayment,
  calculateTax,
  calculateTotal,
  formatPrice,
  isMercadoPagoConfigured
}
