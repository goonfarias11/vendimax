/**
 * Servicio para enviar webhooks
 */

import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export interface WebhookPayload {
  event: string
  data: any
  timestamp: string
  businessId: string
}

export class WebhookService {
  /**
   * Envía un webhook a todas las suscripciones activas
   */
  async send(businessId: string, event: string, data: any): Promise<void> {
    try {
      // Obtener webhooks activos para este evento
      const webhooks = await prisma.webhook.findMany({
        where: {
          businessId,
          isActive: true,
          events: {
            has: event,
          },
        },
      })

      if (webhooks.length === 0) {
        return
      }

      // Payload del webhook
      const payload: WebhookPayload = {
        event,
        data,
        timestamp: new Date().toISOString(),
        businessId,
      }

      // Enviar a cada webhook
      const promises = webhooks.map((webhook) =>
        this.sendToWebhook(webhook, payload)
      )

      await Promise.allSettled(promises)
    } catch (error) {
      console.error('Error enviando webhooks:', error)
    }
  }

  /**
   * Envía el payload a un webhook específico
   */
  private async sendToWebhook(webhook: any, payload: WebhookPayload): Promise<void> {
    try {
      // Generar firma HMAC
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(payload))
        .digest('hex')

      // Enviar request
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': payload.event,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        // Actualizar última llamada exitosa
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: {
            lastCalledAt: new Date(),
            failCount: 0,
          },
        })
      } else {
        // Incrementar contador de fallos
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: {
            failCount: { increment: 1 },
          },
        })

        // Desactivar si hay muchos fallos
        if (webhook.failCount >= 10) {
          await prisma.webhook.update({
            where: { id: webhook.id },
            data: { isActive: false },
          })
        }
      }
    } catch (error) {
      console.error(`Error enviando webhook a ${webhook.url}:`, error)

      // Incrementar contador de fallos
      await prisma.webhook.update({
        where: { id: webhook.id },
        data: {
          failCount: { increment: 1 },
        },
      })
    }
  }

  /**
   * Verifica la firma de un webhook entrante
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  }
}

export const webhookService = new WebhookService()

// Eventos disponibles
export const WEBHOOK_EVENTS = {
  SALE_CREATED: 'sale.created',
  SALE_UPDATED: 'sale.updated',
  SALE_REFUNDED: 'sale.refunded',
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_STOCK_LOW: 'product.stock_low',
  CLIENT_CREATED: 'client.created',
  CLIENT_UPDATED: 'client.updated',
  INVOICE_CREATED: 'invoice.created',
  INVOICE_AUTHORIZED: 'invoice.authorized',
} as const
