import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendPasswordResetEmail } from "@/lib/email"
import crypto from "crypto"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = (body?.email || "").toString().trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 })
    }

    // Siempre responder OK para no revelar si el email existe
    const user = await prisma.user.findUnique({ where: { email } })

    if (user && user.isActive) {
      // Invalidar tokens anteriores del usuario
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })

      // Generar token seguro
      const token = crypto.randomBytes(32).toString("hex")
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

      await prisma.passwordResetToken.create({
        data: { token, userId: user.id, expiresAt }
      })

      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
      })
    }

    // Siempre mismo mensaje para no revelar si el email existe
    return NextResponse.json({
      message: "Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña."
    })

  } catch (error) {
    return NextResponse.json({ error: "No se pudo procesar la solicitud" }, { status: 500 })
  }
}
