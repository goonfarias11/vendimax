import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { apiRateLimit } from "@/lib/rateLimit"
import { logger } from "@/lib/logger"
import { CashMovementType, Prisma } from "@prisma/client"
import { z } from "zod"
import { requireTenant } from "@/lib/security/tenant"

const createCashMovementSchema = z.object({
  type: z.enum(["APERTURA", "CIERRE", "INGRESO", "EGRESO"]),
  amount: z.number().positive("El monto debe ser mayor a 0"),
  description: z.string().optional(),
  reference: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "127.0.0.1"
    const { success } = await apiRateLimit(ip)

    if (!success) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." },
        { status: 429 },
      )
    }

    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const type = searchParams.get("type")

    const where: Prisma.CashMovementWhereInput = {
      businessId: tenant,
    }

    if (startDate || endDate) {
      const createdAtFilter: Prisma.DateTimeFilter = {}
      if (startDate) createdAtFilter.gte = new Date(startDate)
      if (endDate) createdAtFilter.lte = new Date(endDate)
      where.createdAt = createdAtFilter
    }

    if (type) {
      const validTypes: CashMovementType[] = ["APERTURA", "CIERRE", "INGRESO", "EGRESO", "VENTA", "SALIDA"]
      if (validTypes.includes(type as CashMovementType)) {
        where.type = type as CashMovementType
      }
    }

    const movements = await prisma.cashMovement.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const ingresos = movements
      .filter((m) => m.type === "INGRESO" || m.type === "APERTURA")
      .reduce((sum, m) => sum + Number(m.amount), 0)

    const egresos = movements
      .filter((m) => m.type === "EGRESO" || m.type === "CIERRE" || m.type === "SALIDA")
      .reduce((sum, m) => sum + Number(m.amount), 0)

    const totals = {
      ingresos,
      egresos,
      balance: ingresos - egresos,
    }

    logger.info("Movimientos de caja obtenidos", {
      userId: session!.user.id,
      count: movements.length,
      filters: { startDate, endDate, type },
    })

    const formattedMovements = movements.map((m) => ({
      ...m,
      amount: Number(m.amount),
    }))

    return NextResponse.json({
      movements: formattedMovements,
      totals,
      success: true,
    })
  } catch (error: unknown) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "127.0.0.1"
    const { success } = await apiRateLimit(ip)

    if (!success) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." },
        { status: 429 },
      )
    }

    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant

    const body = await request.json()
    const validation = createCashMovementSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: validation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      )
    }

    const { type, amount, description, reference } = validation.data

    if (type === "CIERRE") {
      const lastOpening = await prisma.cashMovement.findFirst({
        where: { type: "APERTURA", businessId: tenant },
        orderBy: { createdAt: "desc" },
      })

      const lastClosing = await prisma.cashMovement.findFirst({
        where: { type: "CIERRE", businessId: tenant },
        orderBy: { createdAt: "desc" },
      })

      if (!lastOpening) {
        return NextResponse.json({ error: "No hay una apertura de caja registrada" }, { status: 400 })
      }

      if (lastClosing && lastClosing.createdAt > lastOpening.createdAt) {
        return NextResponse.json({ error: "La caja ya está cerrada" }, { status: 400 })
      }
    }

    if (type === "APERTURA") {
      const lastOpening = await prisma.cashMovement.findFirst({
        where: { type: "APERTURA", businessId: tenant },
        orderBy: { createdAt: "desc" },
      })

      const lastClosing = await prisma.cashMovement.findFirst({
        where: { type: "CIERRE", businessId: tenant },
        orderBy: { createdAt: "desc" },
      })

      if (lastOpening && (!lastClosing || lastClosing.createdAt < lastOpening.createdAt)) {
        return NextResponse.json(
          { error: "Ya existe una caja abierta. Ciérrala antes de abrir una nueva." },
          { status: 400 },
        )
      }
    }

    const movement = await prisma.cashMovement.create({
      data: {
        type,
        amount,
        description,
        reference,
        userId: session!.user.id,
        businessId: tenant,
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

    logger.info("Movimiento de caja creado", {
      movementId: movement.id,
      type: movement.type,
      amount: Number(movement.amount),
      userId: session!.user.id,
    })

    return NextResponse.json(
      {
        movement,
        success: true,
        message: `${
          type === "APERTURA" ? "Caja abierta" : type === "CIERRE" ? "Caja cerrada" : "Movimiento registrado"
        } exitosamente`,
      },
      { status: 201 },
    )
  } catch (error: unknown) {
    console.error("[API ERROR]", error)

    const prismaCode =
      typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: string }).code
        : undefined

    if (prismaCode === "P2002") {
      return NextResponse.json({ error: "Ya existe un movimiento con esa referencia" }, { status: 409 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
