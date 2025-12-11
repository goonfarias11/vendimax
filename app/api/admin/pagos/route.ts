// app/api/admin/pagos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'

    // Obtener pagos pendientes por transferencia
    const payments = await prisma.payment.findMany({
      where: {
        method: 'transfer',
        status: status as any
      },
      include: {
        subscription: {
          include: {
            plan: true,
            business: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      payments: payments.map(payment => ({
        id: payment.id,
        amount: Number(payment.amount),
        type: payment.type,
        status: payment.status,
        method: payment.method,
        transferProof: payment.transferProof,
        transferReference: payment.transferReference,
        adminNotes: payment.adminNotes,
        createdAt: payment.createdAt,
        paidAt: payment.paidAt,
        business: {
          id: payment.subscription.business.id,
          name: payment.subscription.business.name,
          email: payment.subscription.business.email
        },
        subscription: {
          id: payment.subscription.id,
          planName: payment.subscription.plan.name,
          billingCycle: payment.subscription.billingCycle
        }
      }))
    })

  } catch (error) {
    console.error('Error al obtener pagos:', error)
    return NextResponse.json(
      { error: 'Error al obtener pagos' },
      { status: 500 }
    )
  }
}
