// app/api/subscriptions-ars/setup-fee/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createPayment } from '@/lib/mercadopago'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        business: {
          include: {
            subscriptionARS: {
              include: {
                plan: true
              }
            }
          }
        }
      }
    })

    if (!user?.business?.subscriptionARS) {
      return NextResponse.json(
        { error: 'No tiene una suscripción' },
        { status: 400 }
      )
    }

    const subscription = user.business.subscriptionARS

    if (subscription.setupFeePaid) {
      return NextResponse.json(
        { error: 'Setup Fee ya fue pagado' },
        { status: 400 }
      )
    }

    const { paymentMethod } = await request.json()

    // Si el método es MercadoPago, crear preferencia de pago
    if (paymentMethod === 'mercadopago') {
      const setupFeeAmount = Number(subscription.setupFeeAmount || 60000)
      
      try {
        const payment = await createPayment({
          transaction_amount: setupFeeAmount,
          description: `Setup Fee - ${subscription.plan.name}`,
          payment_method_id: 'account_money', // O el método que envíe el cliente
          payer: {
            email: user.business.email
          },
          external_reference: `setup-${subscription.id}`,
          notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`
        })

        // Registrar el pago como pendiente
        await prisma.payment.create({
          data: {
            subscriptionId: subscription.id,
            amount: subscription.setupFeeAmount || 60000,
            currency: 'ARS',
            type: 'setup_fee',
            method: 'mercadopago',
            status: 'pending',
            mercadopagoPaymentId: payment.id?.toString()
          }
        })

        return NextResponse.json({
          success: true,
          paymentId: payment.id,
          status: payment.status
        })
      } catch (error) {
        console.error('Error al crear pago de Setup Fee:', error)
        return NextResponse.json(
          { error: 'Error al procesar el pago' },
          { status: 500 }
        )
      }
    }

    // Si el método es transferencia, marcar como pendiente de aprobación
    if (paymentMethod === 'transfer') {
      await prisma.payment.create({
        data: {
          subscriptionId: subscription.id,
          amount: subscription.setupFeeAmount || 60000,
          currency: 'ARS',
          type: 'setup_fee',
          method: 'transfer',
          status: 'pending'
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Debe subir el comprobante de transferencia para su aprobación',
        transferInfo: {
          bank: 'Banco Ejemplo',
          accountNumber: '1234567890',
          cbu: '0000000000000000000000',
          alias: 'VENDIMAX.SETUP',
          amount: Number(subscription.setupFeeAmount || 60000)
        }
      })
    }

    return NextResponse.json(
      { error: 'Método de pago no válido' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error al procesar Setup Fee:', error)
    return NextResponse.json(
      { error: 'Error al procesar el pago' },
      { status: 500 }
    )
  }
}
