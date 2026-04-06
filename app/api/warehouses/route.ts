/**
 * API para gestionar depósitos/almacenes
 * GET /api/warehouses
 * POST /api/warehouses
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireTenant } from "@/lib/security/tenant"
import { warehouseSchema } from "@/lib/validation/warehouse.schema"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get("activeOnly") === "true"
    const branchId = searchParams.get("branchId")

    const warehouses = await prisma.warehouse.findMany({
      where: {
        branch: {
          businessId: tenant,
        },
        ...(activeOnly && { isActive: true }),
        ...(branchId && { branchId }),
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            productStocks: true,
            sales: true,
          },
        },
      },
      orderBy: [{ isMain: "desc" }, { name: "asc" }],
    })

    return NextResponse.json(warehouses)
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant

    const parsed = warehouseSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.issues }, { status: 400 })
    }
    const { name, code, address, isMain, isActive, branchId } = parsed.data

    const branch = await prisma.branch.findFirst({
      where: { id: branchId, businessId: tenant },
    })

    if (!branch) {
      return NextResponse.json({ error: "Sucursal no encontrada" }, { status: 404 })
    }

    const warehouse = await prisma.$transaction(async (tx) => {
      if (isMain) {
        await tx.warehouse.updateMany({
          where: {
            branchId,
            isMain: true,
          },
          data: { isMain: false },
        })
      }

      return tx.warehouse.create({
        data: {
          branchId,
          name,
          code: code || branch.code,
          address: address || null,
          isMain: isMain || false,
          isActive: isActive ?? true,
        },
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      })
    })

    return NextResponse.json(warehouse, { status: 201 })
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
