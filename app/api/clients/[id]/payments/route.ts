import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { Decimal } from "@prisma/client/runtime/library"
import { requirePermission } from "@/lib/auth-middleware"
import { Prisma } from "@prisma/client"
import { requireTenant } from "@/lib/security/tenant"
import { clientPaymentSchema } from "@/lib/validation/clientPayment.schema"

export const runtime = "nodejs"

async function logActivity(
  clientId: string,
  action: string,
  description: string,
  userId: string,
  metadata?: Prisma.InputJsonValue,
  ipAddress?: string,
) {
  try {
    await prisma.clientActivityLog.create({
      data: {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        clientId,
        action,
        description,
        userId,
        metadata,
        ipAddress,
        createdAt: new Date(),
      },
    })
  } catch (error) {
    logger.error("Error logging activity:", error)
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant

    const client = await prisma.client.findFirst({
      where: {
        id,
        businessId: tenant,
      },
    })

    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    const payments = await prisma.clientPayment.findMany({
      where: { clientId: id, client: { businessId: tenant } },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const permissionCheck = await requirePermission(request, "clients:register_payment")
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant

    const body = await request.json()
    const parsed = clientPaymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.issues }, { status: 400 })
    }
    const { amount, paymentMethod, reference, notes } = parsed.data

    const client = await prisma.client.findFirst({
      where: {
        id,
        businessId: tenant,
      },
    })

    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    const [payment, updatedClient] = await prisma.$transaction(async (tx) => {
      const newPayment = await tx.clientPayment.create({
        data: {
          id: `payment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          clientId: id,
          amount: new Decimal(amount),
          paymentMethod,
          reference: reference || null,
          notes: notes || null,
          userId: session!.user.id!,
          createdAt: new Date(),
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      })

      const newDebt = Math.max(0, Number(client.currentDebt) - Number(amount))
      const updatedClient = await tx.client.update({
        where: { id, businessId: tenant },
        data: {
          currentDebt: newDebt,
          updatedAt: new Date(),
        },
      })

      if (updatedClient.status === "DELINQUENT" && updatedClient.currentDebt <= updatedClient.creditLimit) {
        await tx.client.update({
          where: { id, businessId: tenant },
          data: { status: "ACTIVE" },
        })
      }

      return [newPayment, updatedClient] as const
    })

    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    await logActivity(
      id,
      "PAYMENT",
      `Pago registrado: $${amount} vía ${paymentMethod}`,
      session!.user.id,
      {
        amount,
        paymentMethod,
        reference,
        previousDebt: client.currentDebt.toString(),
        newDebt: updatedClient.currentDebt.toString(),
      },
      ipAddress,
    )

    return NextResponse.json({
      payment,
      client: updatedClient,
    })
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
