import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Endpoint temporal — eliminar después de usar
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret")
  if (secret !== "fix-gonza-2026") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const email = request.nextUrl.searchParams.get("email")
  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { email },
    data: { role: "OWNER", adminRole: "super_admin", isActive: true }
  })

  return NextResponse.json({ ok: true, adminRole: user.adminRole, role: user.role })
}
