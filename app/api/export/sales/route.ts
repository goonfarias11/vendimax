/**
 * API para exportar ventas a Excel
 * GET /api/export/sales - Exporta ventas en formato Excel
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { excelExportService } from "@/lib/export/excel"
import { Prisma } from "@prisma/client"
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

    const dateFilter: Prisma.DateTimeFilter = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      dateFilter.lte = end
    }

    const sales = await prisma.sale.findMany({
      where: {
        businessId: tenant,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
      include: {
        client: {
          select: {
            name: true,
          },
        },
        saleItems: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const business = await prisma.business.findUnique({
      where: { id: tenant },
    })

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 })
    }

    const buffer = await excelExportService.exportSales(sales, business)

    const filename = `ventas_${startDate || "todas"}_${endDate || "hasta_hoy"}.xlsx`

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
