// app/api/webhooks/mercadopago/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPayment, getPreApproval } from '@/lib/mercadopago'
import { sendSetupFeeConfirmedEmail, sendMonthlyPaymentApprovedEmail } from '@/lib/email'
import crypto from 'crypto'

// Verificar firma de MercadoPago para seguridad
function verifyMercadoPagoSignature(request: NextRequest, body: any): boolean {
  try {
    const xSignature = request.headers.get('x-signature')
    const xRequestId = request.headers.get('x-request-id')
    
    if (!xSignature || !xRequestId) {
      console.warn('⚠️ Webhook sin headers de firma')
      return false
    }

    // Extraer ts y hash de x-signature (formato: "ts=123456,v1=hash")
    const signatureParts = xSignature.split(',')
    let ts = ''
    let hash = ''
    
    signatureParts.forEach(part => {
      const [key, value] = part.split('=')
      if (key === 'ts') ts = value
      if (key === 'v1') hash = value
    })

    if (!ts || !hash) {
      console.warn('⚠️ Formato de firma inválido')
      return false
    }

    // Construir string manifest según documentación de MercadoPago
    const dataId = body.data?.id || ''
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
    
    // Obtener secret key de MercadoPago
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
    
    if (!secret) {
      console.warn('⚠️ MERCADOPAGO_WEBHOOK_SECRET no configurado')
      // En desarrollo, permitir sin verificación
      return process.env.NODE_ENV === 'development'
    }

    // Calcular HMAC SHA256
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(manifest)
    const calculatedHash = hmac.digest('hex')

    // Comparar hashes
    const isValid = calculatedHash === hash
    
    if (!isValid) {
      console.error('❌ Firma de webhook inválida')
    }

    return isValid

  } catch (error) {
    console.error('Error verificando firma de webhook:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  let webhookLogId: string | undefined

  try {
    const body = await request.json()
    
    console.log('Webhook MercadoPago recibido:', body)

    // Registrar webhook en la base de datos
    const webhookLog = await prisma.webhookLog.create({
      data: {
        type: body.type || 'unknown',
        source: 'mercadopago',
        payload: body,
        status: 'received'
      }
    })
    webhookLogId = webhookLog.id

    // Verificar firma de seguridad
    const isValidSignature = verifyMercadoPagoSignature(request, body)
    
    if (!isValidSignature) {
      console.error('❌ Webhook rechazado: firma inválida')
      
      // Actualizar log con error
      await prisma.webhookLog.update({
        where: { id: webhookLogId },
        data: {
          status: 'error',
          error: 'Invalid signature'
        }
      })

      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Verificar el tipo de notificación
    const { type, data } = body

    // Notificación de pago
    if (type === 'payment') {
      await handlePaymentNotification(data.id)
    }

    // Notificación de suscripción
    if (type === 'subscription_preapproval' || type === 'preapproval') {
      await handleSubscriptionNotification(data.id)
    }

    // Notificación de pago recurrente autorizado
    if (type === 'subscription_authorized_payment') {
      await handleAuthorizedPayment(data.id)
    }

    // Actualizar log como procesado exitosamente
    if (webhookLogId) {
      await prisma.webhookLog.update({
        where: { id: webhookLogId },
        data: { status: 'processed' }
      })
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Error en webhook MercadoPago:', error)
    
    // Actualizar log con error
    if (webhookLogId) {
      await prisma.webhookLog.update({
        where: { id: webhookLogId },
        data: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }).catch(err => console.error('Error actualizando log:', err))
    }

    return NextResponse.json(
      { error: 'Error al procesar webhook' },
      { status: 500 }
    )
  }
}

async function handlePaymentNotification(paymentId: string) {
  try {
    // Obtener información del pago desde MercadoPago
    const mpPayment = await getPayment(paymentId)
    
    if (!mpPayment) {
      console.error('Pago no encontrado en MercadoPago:', paymentId)
      return
    }

    // Buscar el pago en nuestra base de datos
    const payment = await prisma.payment.findFirst({
      where: {
        mercadopagoPaymentId: paymentId.toString()
      },
      include: {
        subscription: {
          include: {
            plan: true
          }
        }
      }
    })

    if (!payment) {
      console.log('Pago no encontrado en BD:', paymentId)
      return
    }

    // Actualizar estado del pago
    const newStatus = mpPayment.status === 'approved' ? 'approved' :
                     mpPayment.status === 'rejected' ? 'rejected' :
                     mpPayment.status === 'pending' ? 'pending' : 'pending'

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        mercadopagoStatus: mpPayment.status,
        paidAt: mpPayment.status === 'approved' ? new Date() : null
      }
    })

    // Si el pago fue aprobado y es un Setup Fee, marcar como pagado
    if (mpPayment.status === 'approved' && payment.type === 'setup_fee') {
      const updatedSubscription = await prisma.subscriptionARS.update({
        where: { id: payment.subscriptionId },
        data: {
          setupFeePaid: true,
          setupFeePaidAt: new Date(),
          status: 'active'
        },
        include: {
          plan: true,
          business: true
        }
      })

      console.log('Setup Fee pagado, suscripción activada:', payment.subscriptionId)

      // Enviar email de confirmación
      if (updatedSubscription.business?.email) {
        await sendSetupFeeConfirmedEmail({
          to: updatedSubscription.business.email,
          businessName: updatedSubscription.business.name,
          planName: updatedSubscription.plan.name,
          setupFeeAmount: Number(payment.amount),
          activationDate: new Date()
        }).catch(err => console.error('Error enviando email de confirmación:', err))
      }
    }

    // Si es un pago mensual aprobado, extender el período
    if (mpPayment.status === 'approved' && payment.type === 'monthly') {
      const subscription = await prisma.subscriptionARS.findUnique({
        where: { id: payment.subscriptionId },
        include: {
          plan: true,
          business: true
        }
      })

      if (subscription) {
        const newEndDate = new Date(subscription.currentPeriodEnd)
        newEndDate.setMonth(newEndDate.getMonth() + 1)

        await prisma.subscriptionARS.update({
          where: { id: subscription.id },
          data: {
            currentPeriodStart: subscription.currentPeriodEnd,
            currentPeriodEnd: newEndDate,
            status: 'active'
          }
        })

        console.log('Período de suscripción extendido:', subscription.id)

        // Enviar email de pago procesado
        if (subscription.business?.email) {
          const nextPaymentDate = new Date(newEndDate)
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1)

          await sendMonthlyPaymentApprovedEmail({
            to: subscription.business.email,
            businessName: subscription.business.name,
            planName: subscription.plan.name,
            amount: Number(payment.amount),
            paymentDate: new Date(),
            nextPaymentDate
          }).catch(err => console.error('Error enviando email de pago mensual:', err))
        }
      }
    }

  } catch (error) {
    console.error('Error al procesar notificación de pago:', error)
  }
}

async function handleSubscriptionNotification(preapprovalId: string) {
  try {
    // Obtener información de la suscripción desde MercadoPago
    const preapproval = await getPreApproval(preapprovalId)
    
    if (!preapproval) {
      console.error('Suscripción no encontrada en MercadoPago:', preapprovalId)
      return
    }

    // Buscar la suscripción en nuestra base de datos
    const subscription = await prisma.subscriptionARS.findFirst({
      where: {
        mercadopagoPreapprovalId: preapprovalId
      }
    })

    if (!subscription) {
      console.log('Suscripción no encontrada en BD:', preapprovalId)
      return
    }

    // Actualizar estado según el estado de MercadoPago
    const statusMap: Record<string, string> = {
      'authorized': 'active',
      'paused': 'past_due',
      'cancelled': 'canceled',
      'pending': 'pending'
    }

    const newStatus = statusMap[preapproval.status] || subscription.status

    await prisma.subscriptionARS.update({
      where: { id: subscription.id },
      data: {
        status: newStatus,
        canceledAt: preapproval.status === 'cancelled' ? new Date() : null
      }
    })

    console.log(`Suscripción ${subscription.id} actualizada a estado: ${newStatus}`)

  } catch (error) {
    console.error('Error al procesar notificación de suscripción:', error)
  }
}

async function handleAuthorizedPayment(paymentId: string) {
  try {
    // Similar a handlePaymentNotification pero para pagos recurrentes
    await handlePaymentNotification(paymentId)
  } catch (error) {
    console.error('Error al procesar pago autorizado:', error)
  }
}

// Permitir GET para verificación de webhook
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Webhook MercadoPago funcionando'
  })
}
