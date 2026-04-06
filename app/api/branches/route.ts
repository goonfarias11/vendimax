/**
 * API para gestionar sucursales
 * GET /api/branches
 * POST /api/branches
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireTenant } from "@/lib/security/tenant"
import { branchSchema } from "@/lib/validation/branch.schema"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get("activeOnly") === "true"

    const branches = await prisma.branch.findMany({
      where: {
        businessId: tenant,
        ...(activeOnly && { isActive: true }),
      },
      include: {
        warehouses: {
          where: activeOnly ? { isActive: true } : undefined,
        },
        _count: {
          select: {
            warehouses: true,
            sales: true,
          },
        },
      },
      orderBy: [{ isMain: "desc" }, { name: "asc" }],
    })

    return NextResponse.json(branches)
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

    if (session!.user.role !== "ADMIN" && session!.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const parsed = branchSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.issues }, { status: 400 })
    }
    const { name, code, address, phone, isMain } = parsed.data

    const result = await prisma.$transaction(async (tx) => {
      if (isMain) {
        await tx.branch.updateMany({
          where: {
            businessId: tenant,
            isMain: true,
          },
          data: { isMain: false },
        })
      }

      const branch = await tx.branch.create({
        data: {
          businessId: tenant,
          name,
          code,
          address,
          phone,
          isMain: isMain || false,
          isActive: parsed.data.isActive ?? true,
        },
      })

      return branch
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const errorCode = typeof error === "object" && error !== null && "code" in error ? (error as { code?: string }).code : undefined

    if (errorCode === "P2002") {
      return NextResponse.json({ error: "Ya existe una sucursal con este código" }, { status: 400 })
    }

    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
