// app/api/subscriptions-ars/payments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener usuario y negocio
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { business: true }
    })

    if (!user?.businessId) {
      return NextResponse.json(
        { error: 'Usuario sin negocio asignado' },
        { status: 400 }
      )
    }

    // Obtener suscripción del negocio
    const subscription = await prisma.subscriptionARS.findFirst({
      where: { businessId: user.businessId }
    })

    if (!subscription) {
      return NextResponse.json({ payments: [] })
    }

    // Obtener últimos 12 pagos
    const payments = await prisma.payment.findMany({
      where: {
        subscriptionId: subscription.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 12
    })

    return NextResponse.json({
      payments: payments.map(payment => ({
        id: payment.id,
        amount: Number(payment.amount),
        type: payment.type,
        status: payment.status,
        method: payment.method,
        invoiceNumber: payment.invoiceNumber,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt
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
