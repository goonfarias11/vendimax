import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { requirePermission } from '@/lib/auth-middleware'
import { z } from 'zod'

const closeCashSchema = z.object({
  cashRegisterId: z.string().cuid(),
  closingAmount: z.number().min(0, 'El monto final debe ser positivo'),
  notes: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    // Verificar permiso
    const permissionCheck = await requirePermission(request, 'cash:close_day')
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const session = await auth()
    if (!session?.user?.id || !session.user.businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = closeCashSchema.parse(body)

    // Verificar que la caja exista y pertenezca al usuario
    const cashRegister = await prisma.cashRegister.findFirst({
      where: {
        id: validatedData.cashRegisterId,
        userId: session.user.id,
        businessId: session.user.businessId,
        status: 'OPEN'
      }
    })

    if (!cashRegister) {
      return NextResponse.json(
        { error: 'Caja no encontrada o ya cerrada' },
        { status: 404 }
      )
    }

    // Calcular totales de ventas del turno
    const salesStats = await prisma.sale.aggregate({
      where: {
        cashRegisterId: cashRegister.id,
        businessId: session.user.businessId,
        status: 'COMPLETADO'
      },
      _sum: {
        total: true
      },
      _count: {
        id: true
      }
    })

    // Calcular totales por método de pago
    const salesByPaymentMethod = await prisma.sale.groupBy({
      by: ['paymentMethod'],
      where: {
        cashRegisterId: cashRegister.id,
        businessId: session.user.businessId,
        status: 'COMPLETADO'
      },
      _sum: {
        total: true
      }
    })

    const totalCash = salesByPaymentMethod
      .filter(s => s.paymentMethod === 'EFECTIVO')
      .reduce((acc, s) => acc + Number(s._sum.total || 0), 0)
    
    const totalCard = salesByPaymentMethod
      .filter(s => ['TARJETA_DEBITO', 'TARJETA_CREDITO'].includes(s.paymentMethod))
      .reduce((acc, s) => acc + Number(s._sum.total || 0), 0)
    
    const totalTransfer = salesByPaymentMethod
      .filter(s => ['TRANSFERENCIA', 'QR'].includes(s.paymentMethod))
      .reduce((acc, s) => acc + Number(s._sum.total || 0), 0)
    
    const totalOther = salesByPaymentMethod
      .filter(s => !['EFECTIVO', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'TRANSFERENCIA', 'QR'].includes(s.paymentMethod))
      .reduce((acc, s) => acc + Number(s._sum.total || 0), 0)

    // Calcular monto esperado en efectivo (apertura + ventas en efectivo)
    const expectedAmount = Number(cashRegister.openingAmount) + totalCash

    // Calcular diferencia
    const difference = validatedData.closingAmount - expectedAmount

    // Actualizar caja
    const closedCash = await prisma.$transaction(async (tx) => {
      const updated = await tx.cashRegister.update({
        where: { id: cashRegister.id },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
          closingAmount: validatedData.closingAmount,
          expectedAmount: expectedAmount,
          difference: difference,
          totalCash: totalCash,
          totalCard: totalCard,
          totalTransfer: totalTransfer,
          totalOther: totalOther,
          salesCount: salesStats._count.id,
          notes: validatedData.notes ? `${cashRegister.notes || ''}\nCierre: ${validatedData.notes}` : cashRegister.notes
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      // Registrar movimiento de cierre
      await tx.cashMovement.create({
        data: {
          type: 'CIERRE',
          amount: validatedData.closingAmount,
          description: `Cierre de caja - Diferencia: ${difference >= 0 ? '+' : ''}${difference.toFixed(2)} - ${validatedData.notes || 'Sin observaciones'}`,
          userId: session.user.id,
          businessId: session.user.businessId!,
          cashRegisterId: cashRegister.id
        }
      })

      return updated
    })

    return NextResponse.json({
      ...closedCash,
      summary: {
        salesCount: salesStats._count.id,
        totalSales: Number(salesStats._sum.total || 0),
        totalCash,
        totalCard,
        totalTransfer,
        totalOther,
        openingAmount: Number(cashRegister.openingAmount),
        closingAmount: validatedData.closingAmount,
        expectedAmount,
        difference,
        hoursWorked: Math.round((closedCash.closedAt!.getTime() - cashRegister.openedAt.getTime()) / (1000 * 60 * 60) * 10) / 10
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al cerrar caja:', error)
    return NextResponse.json(
      { error: 'Error al cerrar caja' },
      { status: 500 }
    )
  }
}
