/**
 * API para exportar productos a Excel
 * GET /api/export/products - Exporta productos en formato Excel
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { excelExportService } from "@/lib/export/excel"
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
    const categoryId = searchParams.get("categoryId")
    const activeOnly = searchParams.get("activeOnly") === "true"
    const lowStock = searchParams.get("lowStock") === "true"

    const products = await prisma.product.findMany({
      where: {
        businessId: tenant,
        ...(categoryId && { categoryId }),
        ...(activeOnly && { isActive: true }),
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
        ...(lowStock && {
          productStocks: {
            select: {
              stock: true,
              warehouse: {
                select: {
                  branch: {
                    select: {
                      businessId: true,
                    },
                  },
                },
              },
            },
          },
        }),
      },
      orderBy: {
        name: "asc",
      },
    })

    const filteredProducts = lowStock
      ? products.filter((p) => {
          const totalStock =
            (p.productStocks as Array<{
              stock: number
              warehouse?: { branch?: { businessId?: string } }
            }> | undefined)
              ?.reduce((sum, ps) => {
                const belongsToTenant =
                  ps.warehouse?.branch?.businessId === undefined ||
                  ps.warehouse?.branch?.businessId === tenant
                return belongsToTenant ? sum + ps.stock : sum
              }, 0) || 0
          return totalStock <= p.minStock || totalStock === 0
        })
      : products

    const business = await prisma.business.findUnique({
      where: { id: tenant },
    })

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 })
    }

    const buffer = await excelExportService.exportProducts(filteredProducts, business)

    const filename = `productos_${new Date().toISOString().split("T")[0]}.xlsx`

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
