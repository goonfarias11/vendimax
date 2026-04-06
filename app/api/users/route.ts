import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { requirePermission, requireRole } from "@/lib/auth-middleware"
import { hash } from "bcryptjs"
import { Prisma, UserRole } from "@prisma/client"
import { requireTenant } from "@/lib/security/tenant"
import { createUserSchema } from "@/lib/validation/user.schema"

export const runtime = "nodejs"

// GET: Listar usuarios
export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await requirePermission(request, "users:view")
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant

    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const where: Prisma.UserWhereInput = {
      businessId: tenant,
    }

    if (role && role !== "all") {
      const validRoles: UserRole[] = ["OWNER", "ADMIN", "GERENTE", "SUPERVISOR", "VENDEDOR"]
      if (validRoles.includes(role as UserRole)) {
        where.role = role as UserRole
      }
    }

    if (status === "active") {
      where.isActive = true
    } else if (status === "inactive") {
      where.isActive = false
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST: Crear usuario
export async function POST(request: NextRequest) {
  try {
    const permissionCheck = await requirePermission(request, "users:create")
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant

    const parsed = createUserSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.issues }, { status: 400 })
    }

    const { name, email, password, role } = parsed.data

    const existing = await prisma.user.findFirst({
      where: { email, businessId: tenant },
      select: { id: true },
    })

    if (existing) {
      return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 400 })
    }

    const hashedPassword = await hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role,
        businessId: tenant,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
