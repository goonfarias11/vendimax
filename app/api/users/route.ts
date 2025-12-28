import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { requirePermission } from "@/lib/auth-middleware"
import { hash } from "bcryptjs"
import { z } from "zod"

export const runtime = 'nodejs'

const createUserSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.enum(['OWNER', 'ADMIN', 'GERENTE', 'SUPERVISOR', 'VENDEDOR'])
})

// GET: Listar usuarios
export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await requirePermission(request, 'users:view')
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const session = await auth()
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {
      businessId: session.user.businessId
    }

    if (role && role !== 'all') {
      where.role = role
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
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
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ])

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Error al cargar usuarios" }, { status: 500 })
  }
}

// POST: Crear usuario
export async function POST(request: NextRequest) {
  try {
    const permissionCheck = await requirePermission(request, 'users:create')
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const session = await auth()
    if (!session?.user?.businessId || !session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Verificar que el email no exista en este negocio
    const existingUser = await prisma.user.findFirst({
      where: {
        email: validatedData.email,
        businessId: session.user.businessId
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está registrado en este negocio" },
        { status: 400 }
      )
    }

    // Verificar límite de usuarios del plan (opcional - implementar según plan)
    const usersCount = await prisma.user.count({
      where: { businessId: session.user.businessId }
    })

    // TODO: Verificar límite según plan de suscripción
    // Por ahora permitimos hasta 50 usuarios
    if (usersCount >= 50) {
      return NextResponse.json(
        { error: "Has alcanzado el límite de usuarios de tu plan" },
        { status: 403 }
      )
    }

    // Hash de contraseña
    const passwordHash = await hash(validatedData.password, 10)

    // Crear usuario
    const newUser = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        passwordHash,
        role: validatedData.role,
        businessId: session.user.businessId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    // TODO: Enviar email de bienvenida
    // await sendWelcomeEmail(newUser.email, validatedData.password)

    // Log de auditoría
    await prisma.auditLog.create({
      data: {
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId: session.user.id,
        businessId: session.user.businessId,
        action: 'USER_CREATED',
        entity: 'User',
        entityId: newUser.id,
        details: `Usuario ${newUser.email} creado con rol ${newUser.role}`,
        metadata: { 
          userName: newUser.name,
          userEmail: newUser.email,
          userRole: newUser.role
        }
      }
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 })
  }
}
