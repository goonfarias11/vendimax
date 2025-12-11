// app/api/admin/pagos/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendAnnualPaymentApprovedEmail } from '@/lib/email'
import { z } from 'zod'

const updatePaymentSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reason: z.string().optional()
})

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = await context.params
    const body = await request.json()
    const { status, reason } = updatePaymentSchema.parse(body)

    // Obtener el pago
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            plan: true,
            business: true
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      )
    }

    // Actualizar el pago
    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        status,
        adminNotes: reason,
        paidAt: status === 'approved' ? new Date() : null
      }
    })

    // Si fue aprobado, activar suscripción
    if (status === 'approved') {
      const subscription = payment.subscription
      const isSetupFee = payment.type === 'setup_fee'
      const isAnnual = payment.type === 'yearly'

      if (isSetupFee) {
        // Activar suscripción después de Setup Fee
        await prisma.subscriptionARS.update({
          where: { id: subscription.id },
          data: {
            setupFeePaid: true,
            setupFeePaidAt: new Date(),
            status: 'active'
          }
        })

        // Enviar email de activación
        if (subscription.business?.email) {
          await sendAnnualPaymentApprovedEmail({
            to: subscription.business.email,
            businessName: subscription.business.name,
            planName: subscription.plan.name,
            amount: Number(payment.amount),
            paymentDate: new Date(),
            nextPaymentDate: subscription.currentPeriodEnd,
            discount: Number(subscription.priceMonthly) * 12 * 0.2
          }).catch(err => console.error('Error enviando email:', err))
        }
      } else if (isAnnual) {
        // Renovar suscripción anual
        const newEndDate = new Date(subscription.currentPeriodEnd)
        newEndDate.setFullYear(newEndDate.getFullYear() + 1)

        await prisma.subscriptionARS.update({
          where: { id: subscription.id },
          data: {
            currentPeriodStart: subscription.currentPeriodEnd,
            currentPeriodEnd: newEndDate,
            status: 'active'
          }
        })

        // Enviar email de renovación
        if (subscription.business?.email) {
          await sendAnnualPaymentApprovedEmail({
            to: subscription.business.email,
            businessName: subscription.business.name,
            planName: subscription.plan.name,
            amount: Number(payment.amount),
            paymentDate: new Date(),
            nextPaymentDate: newEndDate,
            discount: Number(subscription.priceMonthly) * 12 * 0.2
          }).catch(err => console.error('Error enviando email:', err))
        }
      }
    }

    return NextResponse.json({
      payment: {
        id: updatedPayment.id,
        status: updatedPayment.status,
        amount: Number(updatedPayment.amount)
      }
    })

  } catch (error) {
    console.error('Error al actualizar pago:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Error al actualizar pago' },
      { status: 500 }
    )
  }
}
