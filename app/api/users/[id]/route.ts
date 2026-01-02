import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { requirePermission } from "@/lib/auth-middleware"
import { z } from "zod"

export const runtime = 'nodejs'

const updateUserSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'GERENTE', 'SUPERVISOR', 'VENDEDOR']).optional(),
  isActive: z.boolean().optional()
})

// GET: Obtener detalles de usuario
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const permissionCheck = await requirePermission(request, 'users:view')
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const session = await auth()
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = await prisma.user.findFirst({
      where: {
        id,
        businessId: session.user.businessId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        sales: {
          select: {
            id: true,
            total: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Obtener logs de auditoría
    // TODO: Implementar modelo AuditLog en Prisma schema
    const auditLogs: any[] = []
    // const auditLogs = await prisma.auditLog.findMany({
    //   where: {
    //     OR: [
    //       { userId: id },
    //       { entityId: id, entity: 'User' }
    //     ]
    //   },
    //   orderBy: { createdAt: 'desc' },
    //   take: 10,
    //   select: {
    //     id: true,
    //     action: true,
    //     details: true,
    // //     metadata: true,
    //     createdAt: true,
    //     user: {
    //       select: {
    //         name: true,
    //         email: true
    //       }
    //     }
    //   }
    // })

    return NextResponse.json({
      ...user,
      auditLogs
    })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Error al cargar usuario" }, { status: 500 })
  }
}

// PUT: Actualizar usuario
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const permissionCheck = await requirePermission(request, 'users:edit')
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const session = await auth()
    if (!session?.user?.businessId || !session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Verificar que el usuario existe y pertenece al negocio
    const targetUser = await prisma.user.findFirst({
      where: {
        id,
        businessId: session.user.businessId
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Validaciones de seguridad
    // 1. No permitir que un usuario se modifique a sí mismo
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "No puedes modificar tu propio usuario" },
        { status: 403 }
      )
    }

    // 2. Un ADMIN no puede editar a un OWNER
    if (session.user.role === 'ADMIN' && targetUser.role === 'OWNER') {
      return NextResponse.json(
        { error: "No tienes permisos para editar a un OWNER" },
        { status: 403 }
      )
    }

    // Preparar datos de actualización
    const updateData: any = {}
    const changes: any = {}

    if (validatedData.role !== undefined && validatedData.role !== targetUser.role) {
      updateData.role = validatedData.role
      changes.role = { from: targetUser.role, to: validatedData.role }
    }

    if (validatedData.isActive !== undefined && validatedData.isActive !== targetUser.isActive) {
      updateData.isActive = validatedData.isActive
      changes.isActive = { from: targetUser.isActive, to: validatedData.isActive }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No hay cambios" }, { status: 200 })
    }

    updateData.updatedAt = new Date()

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Log de auditoría
    // TODO: Implementar modelo AuditLog en Prisma schema
    // await prisma.auditLog.create({
    //   data: {
    //     id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    //     userId: session.user.id,
    //     businessId: session.user.businessId,
    //     action: 'USER_UPDATED',
    //     entity: 'User',
    //     entityId: id,
    //     details: `Usuario ${targetUser.email} actualizado`,
    //     metadata: { changes }
    //   }
    // })

    // TODO: Si se suspendió el usuario, invalidar sus sesiones
    // TODO: Si se cambió el rol, refrescar permisos en sesiones activas

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 })
  }
}
