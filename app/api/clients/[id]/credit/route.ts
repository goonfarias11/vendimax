import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireTenant } from "@/lib/security/tenant"
import { clientCreditSchema } from "@/lib/validation/clientCredit.schema"
import { ZodError } from "zod"

// PUT /api/clients/[id]/credit - Gestionar límite de crédito o pago CC
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant
    const { id } = await params

    const parsed = clientCreditSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.issues }, { status: 400 })
    }
    const { creditLimit, payment } = parsed.data

    const client = await prisma.client.findFirst({
      where: { id, businessId: tenant },
      select: {
        id: true,
        name: true,
        creditLimit: true,
        currentDebt: true,
      },
    })

    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    if (payment !== undefined && payment > 0) {
      const result = await prisma.$transaction(async (tx) => {
        const currentDebt = parseFloat(client.currentDebt.toString())
        const newDebt = Math.max(0, currentDebt - payment)

        await tx.client.update({
          where: { id, businessId: tenant },
          data: { currentDebt: newDebt },
        })

        await tx.cashMovement.create({
          data: {
            userId: session!.user.id,
            type: "INGRESO",
            amount: payment,
            description: `Pago cuenta corriente - ${client.name}`,
            reference: `credit-payment-${id}`,
            businessId: tenant,
          },
        })

        return {
          previousDebt: currentDebt,
          newDebt,
          payment,
        }
      })

      return NextResponse.json({
        success: true,
        message: "Pago registrado exitosamente",
        ...result,
      })
    }

    if (creditLimit !== undefined) {
      const updated = await prisma.client.update({
        where: { id, businessId: tenant },
        data: { creditLimit },
        select: {
          id: true,
          name: true,
          creditLimit: true,
          currentDebt: true,
        },
      })

      return NextResponse.json({
        success: true,
        message: "Límite de crédito actualizado",
        client: updated,
      })
    }

    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 })
    }
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/clients/[id]/credit - Obtener estado de cuenta del cliente
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant
    const { id } = await params

    const client = await prisma.client.findFirst({
      where: { id, businessId: tenant },
      include: {
        sales: {
          where: {
            businessId: tenant,
            paymentMethod: "CUENTA_CORRIENTE",
            status: "COMPLETADO",
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 50,
          select: {
            id: true,
            total: true,
            createdAt: true,
            status: true,
          },
        },
      },
    })

    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    const creditLimit = parseFloat(client.creditLimit.toString())
    const currentDebt = parseFloat(client.currentDebt.toString())
    const availableCredit = creditLimit - currentDebt
    const creditUsagePercentage = creditLimit > 0 ? (currentDebt / creditLimit) * 100 : 0

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        creditLimit,
        currentDebt,
        availableCredit: Math.max(0, availableCredit),
        creditUsagePercentage: Math.round(creditUsagePercentage),
      },
      recentSales: client.sales,
      stats: {
        totalCreditSales: client.sales.length,
        totalAmount: client.sales.reduce((sum, sale) => sum + parseFloat(sale.total.toString()), 0),
      },
    })
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
