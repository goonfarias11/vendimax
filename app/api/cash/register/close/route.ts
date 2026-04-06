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
import { requireTenant } from '@/lib/security/tenant'
import { cashCloseSchema } from '@/lib/validation/cash/cashClose.schema'

export async function POST(request: NextRequest) {
  try {
    const permissionCheck = await requirePermission(request, 'cash:close_day')
    if (!permissionCheck.authorized) return permissionCheck.response

    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant

    const body = await request.json()
    const parsed = cashCloseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.issues },
        { status: 400 }
      )
    }
    const validatedData = parsed.data

    const cashRegister = await prisma.cashRegister.findFirst({
      where: {
        id: validatedData.cashRegisterId,
        userId: session!.user.id,
        businessId: tenant,
        status: 'OPEN'
      }
    })

    if (!cashRegister) {
      return NextResponse.json(
        { error: 'Caja no encontrada o ya cerrada' },
        { status: 404 }
      )
    }

    const existingClosing = await prisma.cashRegister.count({
      where: { id: cashRegister.id, businessId: tenant, status: 'CLOSED' }
    })
    const noClosingValidation = validateNoPreviousClosing(cashRegister.id, existingClosing > 0)
    if (!noClosingValidation.valid) {
      return NextResponse.json(
        { error: noClosingValidation.error },
        { status: 400 }
      )
    }

    const sales = await prisma.sale.findMany({
      where: {
        cashRegisterId: cashRegister.id,
        businessId: tenant,
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

    const refunds = await prisma.refund.findMany({
      where: {
        sale: {
          cashRegisterId: cashRegister.id,
          businessId: tenant
        }
      },
      select: {
        id: true,
        refundAmount: true
      }
    })

    const mixedPaymentSales = await prisma.sale.findMany({
      where: {
        cashRegisterId: cashRegister.id,
        businessId: tenant,
        hasMixedPayment: true,
        status: 'COMPLETADO'
      },
      include: {
        salePayments: true
      }
    })

    const salesByPaymentMethod = await prisma.sale.groupBy({
      by: ['paymentMethod'],
      where: {
        cashRegisterId: cashRegister.id,
        businessId: tenant,
        status: 'COMPLETADO',
        hasMixedPayment: false
      },
      _sum: { total: true }
    })

    const totalMixedPayments = mixedPaymentSales.reduce((acc, sale) => {
      const sumPayments = sale.salePayments.reduce((pAcc, p) => pAcc + Number(p.amount), 0)
      return acc + sumPayments
    }, 0)

    const totalsByMethod = salesByPaymentMethod.reduce((acc, item) => {
      acc[item.paymentMethod] = Number(item._sum.total) || 0
      return acc
    }, {} as Record<string, number>)

    const totalCash = totalsByMethod['EFECTIVO'] || 0
    const totalCard = (totalsByMethod['TARJETA_DEBITO'] || 0) + (totalsByMethod['TARJETA_CREDITO'] || 0)
    const totalTransfer = (totalsByMethod['TRANSFERENCIA'] || 0) + (totalsByMethod['QR'] || 0)
    const totalOther = totalsByMethod['OTRO'] || 0
    const totalRefunds = refunds.reduce((acc, r) => acc + Number(r.refundAmount), 0)

    const totalGrossSales = sales.reduce((acc, s) => acc + Number(s.total), 0)
    const totalNetSales = totalGrossSales - totalRefunds

    const expectedAmount = calculateExpectedCash(
      Number(cashRegister.openingAmount),
      totalCash,
      totalMixedPayments
    )
    const difference = calculateCashDifference(expectedAmount, validatedData.closingAmount)

    const diffValidation = validateCashDifference(difference)
    if (!diffValidation.valid) {
      return NextResponse.json(
        { error: diffValidation.error },
        { status: 400 }
      )
    }

    const closedCash = await prisma.$transaction(async (tx) => {
      const updated = await tx.cashRegister.update({
        where: { id: cashRegister.id },
        data: {
          closingAmount: validatedData.closingAmount,
          expectedAmount,
          difference,
          status: 'CLOSED',
          closedAt: new Date(),
          notes: validatedData.notes
        }
      })

      await tx.cashMovement.create({
        data: {
          type: 'CIERRE',
          amount: validatedData.closingAmount,
          description: `Cierre de caja - ${validatedData.notes || 'Sin observaciones'}`,
          userId: session!.user.id,
          businessId: tenant,
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
        totalInvoiced: 0,
        totalNotInvoiced: 0,
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
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error("[API ERROR]", error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
