import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { requirePermission } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    // Verificar permiso básico de caja
    const permissionCheck = await requirePermission(request, 'cash:view')
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const session = await auth()
    if (!session?.user?.id || !session.user.businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {
      businessId: session.user.businessId
    }

    // Si es VENDEDOR, solo ver sus propias cajas
    if (session.user.role === 'VENDEDOR') {
      where.userId = session.user.id
    } else if (userId && userId !== 'all') {
      // ADMIN/OWNER puede filtrar por vendedor
      where.userId = userId
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (startDate) {
      where.openedAt = {
        ...where.openedAt,
        gte: new Date(startDate)
      }
    }

    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      where.openedAt = {
        ...where.openedAt,
        lte: end
      }
    }

    const [cashRegisters, total] = await Promise.all([
      prisma.cashRegister.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          sales: {
            select: {
              id: true,
              total: true,
              status: true
            }
          }
        },
        orderBy: {
          openedAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.cashRegister.count({ where })
    ])

    // Formatear respuesta con estadísticas
    const formattedCashRegisters = cashRegisters.map(cash => {
      const activeSales = cash.sales.filter(s => s.status === 'COMPLETADO')
      const canceledSales = cash.sales.filter(s => s.status === 'CANCELADO')
      const totalSalesAmount = activeSales.reduce((acc, s) => acc + Number(s.total), 0)

      return {
        ...cash,
        openingAmount: Number(cash.openingAmount),
        closingAmount: cash.closingAmount ? Number(cash.closingAmount) : null,
        expectedAmount: cash.expectedAmount ? Number(cash.expectedAmount) : null,
        difference: cash.difference ? Number(cash.difference) : null,
        totalCash: Number(cash.totalCash),
        totalCard: Number(cash.totalCard),
        totalTransfer: Number(cash.totalTransfer),
        totalOther: Number(cash.totalOther),
        stats: {
          salesCount: cash.salesCount,
          activeSalesCount: activeSales.length,
          canceledSalesCount: canceledSales.length,
          totalSalesAmount,
          averageTicket: activeSales.length > 0 ? totalSalesAmount / activeSales.length : 0,
          hoursWorked: cash.closedAt 
            ? Math.round((cash.closedAt.getTime() - cash.openedAt.getTime()) / (1000 * 60 * 60) * 10) / 10
            : Math.round((new Date().getTime() - cash.openedAt.getTime()) / (1000 * 60 * 60) * 10) / 10
        },
        sales: undefined // No enviar el array completo
      }
    })

    return NextResponse.json({
      cashRegisters: formattedCashRegisters,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error al listar cajas:', error)
    return NextResponse.json(
      { error: 'Error al listar cajas' },
      { status: 500 }
    )
  }
}
