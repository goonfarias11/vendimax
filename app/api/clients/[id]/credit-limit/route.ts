import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { requireTenant } from "@/lib/security/tenant"
import { clientCreditLimitSchema } from "@/lib/validation/clientCreditLimit.schema"
import { ZodError } from "zod"
import { Prisma } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"

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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant

    const user = await prisma.user.findUnique({
      where: { id: session!.user.id },
      select: { role: true },
    })

    if (!user || !["GERENTE", "ADMIN", "OWNER"].includes(user.role)) {
      return NextResponse.json(
        { error: "No tienes permisos para modificar límites de crédito" },
        { status: 403 },
      )
    }

    const parsed = clientCreditLimitSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.issues }, { status: 400 })
    }

    const { creditLimit } = parsed.data

    const client = await prisma.client.findFirst({
      where: {
        id,
        businessId: tenant,
      },
    })

    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    const previousLimit = client.creditLimit

    const updatedClient = await prisma.$transaction(async (tx) => {
      const updated = await tx.client.update({
        where: { id, businessId: tenant },
        data: {
          creditLimit: new Decimal(creditLimit),
          updatedAt: new Date(),
        },
      })

      if (updated.currentDebt > updated.creditLimit && updated.status === "ACTIVE") {
        await tx.client.update({
          where: { id, businessId: tenant },
          data: { status: "DELINQUENT" },
        })
      } else if (updated.currentDebt <= updated.creditLimit && updated.status === "DELINQUENT") {
        await tx.client.update({
          where: { id, businessId: tenant },
          data: { status: "ACTIVE" },
        })
      }

      return updated
    })

    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    await logActivity(
      id,
      "CREDIT_LIMIT_CHANGE",
      `Límite de crédito modificado de $${previousLimit} a $${creditLimit}`,
      session!.user.id,
      {
        previousLimit: previousLimit.toString(),
        newLimit: creditLimit.toString(),
        changedBy: session!.user.email,
      },
      ipAddress,
    )

    return NextResponse.json(updatedClient)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 })
    }
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
