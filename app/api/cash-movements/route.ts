import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { apiRateLimit } from "@/lib/rateLimit"
import { logger } from "@/lib/logger"
import { z } from "zod"

// Validación Zod para crear movimiento de caja
const createCashMovementSchema = z.object({
  type: z.enum(["APERTURA", "CIERRE", "INGRESO", "EGRESO"]),
  amount: z.number().positive("El monto debe ser mayor a 0"),
  description: z.string().optional(),
  reference: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "127.0.0.1"
    const { success } = await apiRateLimit(ip)
    
    if (!success) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." },
        { status: 429 }
      )
    }

    // Verificar autenticación
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const type = searchParams.get("type")

    // Construir filtros
    const where: any = {}
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }
    
    if (type) {
      where.type = type
    }

    // Obtener movimientos
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

    // Calcular totales
    const ingresos = movements
      .filter((m) => m.type === "INGRESO" || m.type === "APERTURA")
      .reduce((sum, m) => sum + Number(m.amount), 0)
    
    const egresos = movements
      .filter((m) => m.type === "EGRESO" || m.type === "CIERRE")
      .reduce((sum, m) => sum + Number(m.amount), 0)
    
    const totals = {
      ingresos,
      egresos,
      balance: ingresos - egresos
    }

    logger.info("Movimientos de caja obtenidos", { 
      userId: session.user.id,
      count: movements.length,
      filters: { startDate, endDate, type }
    })

    // Formatear movimientos con números convertidos
    const formattedMovements = movements.map(m => ({
      ...m,
      amount: Number(m.amount)
    }))

    return NextResponse.json({ 
      movements: formattedMovements,
      totals,
      success: true 
    })
  } catch (error: any) {
    logger.error("Error al obtener movimientos de caja:", error)
    return NextResponse.json(
      { error: "Error al obtener movimientos de caja" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "127.0.0.1"
    const { success } = await apiRateLimit(ip)
    
    if (!success) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." },
        { status: 429 }
      )
    }

    // Verificar autenticación
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Parsear y validar el body
    const body = await request.json()
    const validation = createCashMovementSchema.safeParse(body)

    if (!validation.success) {
      logger.warn("Validación fallida en crear movimiento de caja", {
        errors: validation.error.issues,
        body,
      })
      return NextResponse.json(
        { 
          error: "Datos inválidos",
          details: validation.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      )
    }

    const { type, amount, description, reference } = validation.data

    // Validaciones de negocio
    if (type === "CIERRE") {
      // Verificar que haya una apertura sin cierre
      const lastOpening = await prisma.cashMovement.findFirst({
        where: { type: "APERTURA" },
        orderBy: { createdAt: "desc" },
      })

      const lastClosing = await prisma.cashMovement.findFirst({
        where: { type: "CIERRE" },
        orderBy: { createdAt: "desc" },
      })

      if (!lastOpening) {
        return NextResponse.json(
          { error: "No hay una apertura de caja registrada" },
          { status: 400 }
        )
      }

      if (lastClosing && lastClosing.createdAt > lastOpening.createdAt) {
        return NextResponse.json(
          { error: "La caja ya está cerrada" },
          { status: 400 }
        )
      }
    }

    if (type === "APERTURA") {
      // Verificar que no haya una apertura sin cierre
      const lastOpening = await prisma.cashMovement.findFirst({
        where: { type: "APERTURA" },
        orderBy: { createdAt: "desc" },
      })

      const lastClosing = await prisma.cashMovement.findFirst({
        where: { type: "CIERRE" },
        orderBy: { createdAt: "desc" },
      })

      if (lastOpening && (!lastClosing || lastClosing.createdAt < lastOpening.createdAt)) {
        return NextResponse.json(
          { error: "Ya existe una caja abierta. Ciérrala antes de abrir una nueva." },
          { status: 400 }
        )
      }
    }

    // Crear el movimiento de caja
    const movement = await prisma.cashMovement.create({
      data: {
        type,
        amount,
        description,
        reference,
        userId: session.user.id,
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
      userId: session.user.id,
    })

    return NextResponse.json({ 
      movement,
      success: true,
      message: `${type === "APERTURA" ? "Caja abierta" : type === "CIERRE" ? "Caja cerrada" : "Movimiento registrado"} exitosamente`
    }, { status: 201 })
  } catch (error: any) {
    logger.error("Error al crear movimiento de caja:", error)

    // Manejar errores de Prisma
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un movimiento con esa referencia" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "Error al crear movimiento de caja" },
      { status: 500 }
    )
  }
}
