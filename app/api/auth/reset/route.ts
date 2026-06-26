import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"

export const runtime = "nodejs"

// GET: validar que el token es válido (para mostrar el form en el frontend)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || ""

  if (!token) {
    return NextResponse.json({ error: "Token requerido" }, { status: 400 })
  }

  const record = await prisma.passwordResetToken.findUnique({ where: { token } })

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json({ error: "El enlace es inválido o ya expiró" }, { status: 400 })
  }

  return NextResponse.json({ valid: true })
}

// POST: cambiar la contraseña
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json({ error: "Token y contraseña son requeridos" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 })
    }

    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return NextResponse.json({ error: "El enlace es inválido o ya expiró" }, { status: 400 })
    }

    const passwordHash = await hash(password, 12)

    // Actualizar contraseña y marcar token como usado en una transacción
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash }
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() }
      })
    ])

    return NextResponse.json({ message: "Contraseña actualizada correctamente" })

  } catch (error) {
    return NextResponse.json({ error: "No se pudo actualizar la contraseña" }, { status: 500 })
  }
}
