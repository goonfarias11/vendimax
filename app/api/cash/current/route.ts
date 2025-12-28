import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { requirePermission } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await requirePermission(request, 'cash:view')
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const session = await auth()
    if (!session?.user?.id || !session.user.businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Buscar caja abierta del usuario
    const currentCash = await prisma.cashRegister.findFirst({
      where: {
        userId: session.user.id,
        businessId: session.user.businessId,
        status: 'OPEN'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        sales: {
          where: {
            status: 'COMPLETADO'
          },
          select: {
            id: true,
            total: true,
            paymentMethod: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!currentCash) {
      return NextResponse.json({ currentCash: null })
    }

    // Calcular estadísticas en tiempo real
    const salesByPaymentMethod = currentCash.sales.reduce((acc, sale) => {
      const method = sale.paymentMethod
      if (!acc[method]) {
        acc[method] = { count: 0, total: 0 }
      }
      acc[method].count++
      acc[method].total += Number(sale.total)
      return acc
    }, {} as Record<string, { count: number, total: number }>)

    const totalCash = salesByPaymentMethod['EFECTIVO']?.total || 0
    const totalCard = (salesByPaymentMethod['TARJETA_DEBITO']?.total || 0) + (salesByPaymentMethod['TARJETA_CREDITO']?.total || 0)
    const totalTransfer = (salesByPaymentMethod['TRANSFERENCIA']?.total || 0) + (salesByPaymentMethod['QR']?.total || 0)
    const totalSales = currentCash.sales.reduce((acc, s) => acc + Number(s.total), 0)
    const expectedAmount = Number(currentCash.openingAmount) + totalCash

    const hoursOpen = Math.round((new Date().getTime() - currentCash.openedAt.getTime()) / (1000 * 60 * 60) * 10) / 10

    return NextResponse.json({
      currentCash: {
        ...currentCash,
        openingAmount: Number(currentCash.openingAmount),
        stats: {
          salesCount: currentCash.sales.length,
          totalSales,
          totalCash,
          totalCard,
          totalTransfer,
          expectedAmount,
          averageTicket: currentCash.sales.length > 0 ? totalSales / currentCash.sales.length : 0,
          hoursOpen,
          salesByPaymentMethod
        },
        recentSales: currentCash.sales.slice(0, 5).map(s => ({
          ...s,
          total: Number(s.total)
        }))
      }
    })
  } catch (error) {
    console.error('Error al obtener caja actual:', error)
    return NextResponse.json(
      { error: 'Error al obtener estado de caja' },
      { status: 500 }
    )
  }
}
