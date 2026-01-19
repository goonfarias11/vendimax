import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { requirePermission } from '@/lib/auth-middleware'
import { z } from 'zod'
import { 
  validateCashDifference, 
  validateNoPreviousClosing,
  calculateCashDifference,
  calculateExpectedCash
} from '@/lib/cashClosing'

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

    // Verificar que no haya un cierre previo (doble cierre)
    const existingClosing = await prisma.cashRegister.count({
      where: {
        id: cashRegister.id,
        status: 'CLOSED'
      }
    })

    const noClosingValidation = validateNoPreviousClosing(cashRegister.id, existingClosing > 0)
    if (!noClosingValidation.valid) {
      return NextResponse.json(
        { error: noClosingValidation.error },
        { status: 400 }
      )
    }

    // Calcular totales de ventas del turno
    const sales = await prisma.sale.findMany({
      where: {
        cashRegisterId: cashRegister.id,
        businessId: session.user.businessId,
        status: 'COMPLETADO'
      },
      select: {
        id: true,
        total: true,
        subtotal: true,
        paymentMethod: true,
        hasMixedPayment: true
      }
    })

    // Calcular devoluciones del turno
    const refunds = await prisma.refund.findMany({
      where: {
        sale: {
          cashRegisterId: cashRegister.id
        }
      },
      select: {
        id: true,
        refundAmount: true
      }
    })

    // Obtener pagos mixtos
    const mixedPaymentSales = await prisma.sale.findMany({
      where: {
        cashRegisterId: cashRegister.id,
        hasMixedPayment: true,
        status: 'COMPLETADO'
      },
      include: {
        salePayments: true
      }
    })

    // Calcular totales por método de pago
    const salesByPaymentMethod = await prisma.sale.groupBy({
      by: ['paymentMethod'],
      where: {
        cashRegisterId: cashRegister.id,
        businessId: session.user.businessId,
        status: 'COMPLETADO',
        hasMixedPayment: false
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

    // Calcular total de pagos mixtos
    const totalMixedPayments = mixedPaymentSales.reduce((acc, sale) => acc + Number(sale.total), 0)

    // Calcular efectivo en pagos mixtos
    const mixedCashAmount = mixedPaymentSales.reduce((acc, sale) => {
      const cashPayment = sale.salePayments.find(p => p.paymentMethod === 'EFECTIVO')
      return acc + (cashPayment ? Number(cashPayment.amount) : 0)
    }, 0)

    // Calcular monto esperado en efectivo (apertura + ventas en efectivo + efectivo de pagos mixtos)
    const expectedAmount = calculateExpectedCash(
      Number(cashRegister.openingAmount),
      totalCash,
      mixedCashAmount
    )

    // Calcular diferencia
    const difference = calculateCashDifference(validatedData.closingAmount, expectedAmount)

    // Validar diferencia y observaciones
    const cashDifferenceValidation = validateCashDifference(
      difference,
      validatedData.notes
    )

    if (!cashDifferenceValidation.valid) {
      return NextResponse.json(
        { 
          error: cashDifferenceValidation.error,
          requiresNotes: cashDifferenceValidation.requiresNotes,
          difference,
          expectedAmount
        },
        { status: 400 }
      )
    }

    // Calcular total de devoluciones
    const totalRefunds = refunds.reduce((acc, r) => acc + Number(r.refundAmount), 0)

    // Calcular total bruto y neto
    const totalGrossSales = sales.reduce((acc, s) => acc + Number(s.total), 0)
    const totalNetSales = sales.reduce((acc, s) => acc + Number(s.subtotal), 0)

    // TODO: Implementar cálculo de facturado vs no facturado cuando se implemente facturación
    const totalInvoiced = 0
    const totalNotInvoiced = totalGrossSales

    // Actualizar caja con transacción
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
          totalMixedPayments: totalMixedPayments,
          totalRefunds: totalRefunds,
          totalInvoiced: totalInvoiced,
          totalNotInvoiced: totalNotInvoiced,
          salesCount: sales.length,
          refundsCount: refunds.length,
          closedBy: session.user.id,
          requiresAuthorization: Math.abs(difference) >= 50, // Requiere autorización si diferencia es >= $50
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
        salesCount: sales.length,
        refundsCount: refunds.length,
        totalSales: totalGrossSales,
        totalNetSales: totalNetSales,
        totalGrossSales: totalGrossSales,
        totalCash,
        totalCard,
        totalTransfer,
        totalOther,
        totalMixedPayments,
        totalRefunds,
        totalInvoiced,
        totalNotInvoiced,
        openingAmount: Number(cashRegister.openingAmount),
        closingAmount: validatedData.closingAmount,
        expectedAmount,
        difference,
        cashDifference: difference,
        hoursWorked: Math.round((closedCash.closedAt!.getTime() - cashRegister.openedAt.getTime()) / (1000 * 60 * 60) * 10) / 10,
        requiresAuthorization: Math.abs(difference) >= 50
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
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
