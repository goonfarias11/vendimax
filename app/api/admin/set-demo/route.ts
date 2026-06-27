import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret")
  
  if (secret !== "goon-demo-2026") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const email = request.nextUrl.searchParams.get("email")
  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { business: true }
  })

  if (!user?.business) {
    return NextResponse.json({ error: "Usuario o negocio no encontrado" })
  }

  await prisma.business.update({
    where: { id: user.business.id },
    data: { isDemo: true }
  })

  return NextResponse.json({ 
    ok: true, 
    message: `Negocio "${user.business.name}" marcado como demo`
  })
}
