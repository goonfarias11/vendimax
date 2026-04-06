import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { requirePermission } from '@/lib/auth-middleware'
import { requireTenant } from '@/lib/security/tenant'

export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await requirePermission(request, 'cash:view')
    if (!permissionCheck.authorized) return permissionCheck.response

    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant

    const currentCash = await prisma.cashRegister.findFirst({
      where: {
        businessId: tenant,
        userId: session!.user.id,
        status: 'OPEN'
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        sales: {
          where: { status: 'COMPLETADO', businessId: tenant },
          select: {
            id: true,
            total: true,
            paymentMethod: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!currentCash) {
      return NextResponse.json({ currentCash: null })
    }

    const activeSales = currentCash.sales
    const salesByPaymentMethod = activeSales.reduce((acc, sale) => {
      const method = sale.paymentMethod
      if (!acc[method]) acc[method] = { count: 0, total: 0 }
      acc[method].count++
      acc[method].total += Number(sale.total)
      return acc
    }, {} as Record<string, { count: number; total: number }>)

    const totalCash = salesByPaymentMethod['EFECTIVO']?.total || 0
    const totalCard = (salesByPaymentMethod['TARJETA_DEBITO']?.total || 0) + (salesByPaymentMethod['TARJETA_CREDITO']?.total || 0)
    const totalTransfer = (salesByPaymentMethod['TRANSFERENCIA']?.total || 0) + (salesByPaymentMethod['QR']?.total || 0)
    const totalSales = activeSales.reduce((acc, s) => acc + Number(s.total), 0)
    const expectedAmount = Number(currentCash.openingAmount) + totalCash
    const hoursOpen = Math.round((Date.now() - currentCash.openedAt.getTime()) / (1000 * 60 * 60) * 10) / 10

    return NextResponse.json({
      currentCash: {
        ...currentCash,
        openingAmount: Number(currentCash.openingAmount),
        stats: {
          salesCount: activeSales.length,
          totalSales,
          totalCash,
          totalCard,
          totalTransfer,
          expectedAmount,
          averageTicket: activeSales.length > 0 ? totalSales / activeSales.length : 0,
          hoursOpen,
          salesByPaymentMethod
        },
        recentSales: activeSales.slice(0, 5).map(s => ({
          ...s,
          total: Number(s.total)
        }))
      }
    })
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
