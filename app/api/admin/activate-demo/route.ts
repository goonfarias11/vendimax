import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const secret = authHeader?.replace("Bearer ", "") || ""

    if (!secret || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { business: true }
    })

    if (!user?.business) {
      return NextResponse.json({ error: "Usuario o negocio no encontrado" }, { status: 404 })
    }

    await prisma.business.update({
      where: { id: user.business.id },
      data: { isDemo: true }
    })

    return NextResponse.json({
      ok: true,
      message: "Acceso demo activado para " + user.business.name
    })
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
