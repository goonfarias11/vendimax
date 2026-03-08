/**
 * API para que los administradores puedan acceder como otros usuarios
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { signIn } from "next-auth/react"

export const runtime = 'nodejs'

/**
 * POST /api/users/impersonate
 * Permite a un ADMIN iniciar sesión como otro usuario
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Solo los ADMIN pueden hacer impersonation
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "No autorizado. Solo administradores pueden usar esta función." },
        { status: 403 }
      )
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      )
    }

    // Buscar el usuario a impersonar
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        businessId: true,
        isActive: true
      }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    if (!targetUser.isActive) {
      return NextResponse.json(
        { error: "No se puede impersonar un usuario inactivo" },
        { status: 400 }
      )
    }

    // Verificar que el usuario pertenece al mismo negocio
    if (targetUser.businessId !== session.user.businessId) {
      return NextResponse.json(
        { error: "No puedes impersonar usuarios de otros negocios" },
        { status: 403 }
      )
    }

    // No permitir impersonar a otro ADMIN
    if (targetUser.role === 'ADMIN' || targetUser.role === 'OWNER') {
      return NextResponse.json(
        { error: "No se puede impersonar a otro administrador" },
        { status: 403 }
      )
    }

    // Retornar los datos del usuario a impersonar
    // El cliente usará estos datos para actualizar la sesión
    return NextResponse.json({
      success: true,
      impersonatedUser: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        businessId: targetUser.businessId
      },
      originalUser: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role
      }
    })

  } catch (error) {
    console.error("Error en impersonation:", error)
    return NextResponse.json(
      { error: "Error al intentar acceder como otro usuario" },
      { status: 500 }
    )
  }
}
