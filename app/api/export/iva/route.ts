/**
 * API para exportar reporte de IVA a Excel
 * GET /api/export/iva - Exporta reporte de IVA en formato Excel
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { excelExportService } from "@/lib/export/excel"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { requireTenant } from "@/lib/security/tenant"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) {
      return tenantResult.response
    }
    const tenant = tenantResult.tenant

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Fechas de inicio y fin son requeridas" },
        { status: 400 },
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const sales = await prisma.sale.findMany({
      where: {
        businessId: tenant,
        createdAt: {
          gte: start,
          lte: end,
        },
        status: "COMPLETADO",
      },
      include: {
        client: {
          select: {
            name: true,
            taxId: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    const business = await prisma.business.findUnique({
      where: { id: tenant },
    })

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 })
    }

    const period = `${format(start, "dd/MM/yyyy", { locale: es })} - ${format(end, "dd/MM/yyyy", { locale: es })}`

    const buffer = await excelExportService.exportIVA(sales, business, period)

    const filename = `iva_${format(start, "yyyy-MM-dd")}_${format(end, "yyyy-MM-dd")}.xlsx`

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=\"${filename}\"`,
      },
    })
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
