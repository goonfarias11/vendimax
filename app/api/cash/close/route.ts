import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { apiRateLimit } from "@/lib/rateLimit"
import { logger } from "@/lib/logger"
import { closeCashRegisterSchema } from "@/lib/validations"
import {
  buildCashClosingSummary,
  validateHasSalesToClose,
  validateDateRange,
  validateTotals,
  generateClosingSummaryText,
} from "@/lib/cashClosing"

// ============================================
// POST /api/cash/close
// Cierra la caja y registra el cierre
// ============================================

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
      logger.warn("Intento de cierre de caja sin autenticación", { ip })
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Verificar permisos (solo ADMIN, GERENTE, CAJERO)
    const userRole = session.user.role
    if (!["ADMIN", "GERENTE", "CAJERO"].includes(userRole)) {
      logger.warn("Intento de cierre de caja sin permisos", {
        userId: session.user.id,
        role: userRole,
      })
      return NextResponse.json(
        { error: "No tienes permisos para cerrar la caja" },
        { status: 403 }
      )
    }

    // Parsear y validar el body
    const body = await request.json()
    logger.debug("Body recibido en cash/close:", { body })
    
    const validation = closeCashRegisterSchema.safeParse(body)

    if (!validation.success) {
      logger.warn("Validación fallida en cierre de caja", {
        errors: validation.error.issues,
        body,
        userId: session.user.id,
      })
      return NextResponse.json(
        {
          error: "Datos inválidos",
          field: validation.error.issues[0]?.path.join("."),
          details: validation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      )
    }

    const { notes, manualTotalCash, manualTotalCard, manualTotalTransfer } = validation.data

    // ============================================
    // LÓGICA DE NEGOCIO - TRANSACCIÓN
    // ============================================

    const result = await prisma.$transaction(async (tx) => {
      // 1. Buscar último cierre
      const lastClosing = await tx.cashClosing.findFirst({
        orderBy: { createdAt: "desc" },
        select: { to: true, number: true },
      })

      // 2. Determinar rango de fechas
      const from = lastClosing ? lastClosing.to : new Date(0) // Si no hay cierre previo, desde epoch
      const to = new Date()

      // Validar rango de fechas
      const dateValidation = validateDateRange(from, to)
      if (!dateValidation.valid) {
        throw new Error(dateValidation.error)
      }

      // 3. Buscar ventas sin cerrar (COMPLETADO y sin cashClosingId)
      const unclosedSales = await tx.sale.findMany({
        where: {
          cashClosingId: null,
          status: "COMPLETADO",
          createdAt: {
            gte: from,
            lte: to,
          },
        },
        select: {
          id: true,
          total: true,
          paymentMethod: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      })

      // Validar que haya ventas
      const salesValidation = validateHasSalesToClose(unclosedSales.length)
      if (!salesValidation.valid) {
        throw new Error(salesValidation.error)
      }

      // 4. Calcular totales automáticamente
      const summary = buildCashClosingSummary(from, to, unclosedSales)

      // 5. Permitir ajustes manuales (si se proporcionan)
      const finalTotalCash = manualTotalCash ?? summary.totalCash
      const finalTotalCard = manualTotalCard ?? summary.totalCard
      const finalTotalTransfer = manualTotalTransfer ?? summary.totalTransfer
      const finalTotalGeneral = finalTotalCash + finalTotalCard + finalTotalTransfer

      // Validar totales
      const totalsValidation = validateTotals(
        finalTotalCash,
        finalTotalCard,
        finalTotalTransfer,
        finalTotalGeneral
      )
      if (!totalsValidation.valid) {
        throw new Error(totalsValidation.error)
      }

      // 6. Crear el cierre de caja
      const closing = await tx.cashClosing.create({
        data: {
          from,
          to,
          totalCash: finalTotalCash,
          totalCard: finalTotalCard,
          totalTransfer: finalTotalTransfer,
          totalGeneral: finalTotalGeneral,
          notes: notes || null,
          responsibleId: session.user.id,
        },
        include: {
          responsible: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      // 7. Marcar ventas como cerradas
      await tx.sale.updateMany({
        where: {
          id: { in: unclosedSales.map((s) => s.id) },
        },
        data: {
          cashClosingId: closing.id,
        },
      })

      // 8. Registrar movimiento de caja
      await tx.cashMovement.create({
        data: {
          type: "CIERRE",
          amount: finalTotalGeneral,
          description: `Cierre de caja #${closing.number}`,
          reference: closing.id,
          userId: session.user.id,
        },
      })

      logger.info("Cierre de caja creado exitosamente", {
        closingId: closing.id,
        number: closing.number,
        totalGeneral: finalTotalGeneral,
        salesCount: unclosedSales.length,
        responsibleId: session.user.id,
        from: from.toISOString(),
        to: to.toISOString(),
      })

      return {
        closing,
        summary: generateClosingSummaryText(
          {
            ...summary,
            totalCash: finalTotalCash,
            totalCard: finalTotalCard,
            totalTransfer: finalTotalTransfer,
            totalGeneral: finalTotalGeneral,
          },
          closing.number
        ),
        unclosedSalesCount: unclosedSales.length,
      }
    })

    // ============================================
    // RESPUESTA EXITOSA
    // ============================================

    return NextResponse.json(
      {
        success: true,
        message: "Caja cerrada exitosamente",
        data: {
          id: result.closing.id,
          number: result.closing.number,
          from: result.closing.from,
          to: result.closing.to,
          totals: {
            cash: Number(result.closing.totalCash),
            card: Number(result.closing.totalCard),
            transfer: Number(result.closing.totalTransfer),
            general: Number(result.closing.totalGeneral),
          },
          closedBy: {
            id: result.closing.responsible.id,
            name: result.closing.responsible.name,
            email: result.closing.responsible.email,
          },
          salesCount: result.unclosedSalesCount,
          summary: result.summary,
          createdAt: result.closing.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    logger.error("Error al cerrar caja:", error)

    // Errores de negocio (validaciones)
    if (error.message?.includes("No hay ventas sin cerrar")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error.message?.includes("fecha")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error.message?.includes("Inconsistencia en totales")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Errores de Prisma
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un cierre con esos datos" },
        { status: 409 }
      )
    }

    if (error.code === "P2025") {
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 })
    }

    // Error genérico
    return NextResponse.json({ error: "Error al cerrar la caja" }, { status: 500 })
  }
}

// ============================================
// GET /api/cash/close
// Obtiene el último cierre y preview del próximo
// ============================================

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

    // Obtener último cierre
    const lastClosing = await prisma.cashClosing.findFirst({
      orderBy: { createdAt: "desc" },
      include: {
        responsible: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    // Calcular preview del próximo cierre
    const from = lastClosing ? lastClosing.to : new Date(0)
    const to = new Date()

    const unclosedSales = await prisma.sale.findMany({
      where: {
        cashClosingId: null,
        status: "COMPLETADO",
        createdAt: {
          gte: from,
          lte: to,
        },
      },
      select: {
        id: true,
        total: true,
        paymentMethod: true,
        createdAt: true,
      },
    })

    const preview = buildCashClosingSummary(from, to, unclosedSales)

    logger.info("Preview de cierre de caja obtenido", {
      userId: session.user.id,
      unclosedSalesCount: unclosedSales.length,
    })

    return NextResponse.json({
      success: true,
      lastClosing: lastClosing
        ? {
            id: lastClosing.id,
            number: lastClosing.number,
            from: lastClosing.from,
            to: lastClosing.to,
            totalGeneral: Number(lastClosing.totalGeneral),
            responsibleName: lastClosing.responsible.name,
            createdAt: lastClosing.createdAt,
          }
        : null,
      preview: {
        from: preview.from,
        to: preview.to,
        salesCount: preview.salesCount,
        totals: {
          cash: preview.totalCash,
          card: preview.totalCard,
          transfer: preview.totalTransfer,
          general: preview.totalGeneral,
        },
      },
    })
  } catch (error: any) {
    logger.error("Error al obtener preview de cierre:", error)
    return NextResponse.json(
      { error: "Error al obtener información de cierre" },
      { status: 500 }
    )
  }
}
