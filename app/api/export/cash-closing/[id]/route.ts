/**
 * API: Exportar cierre de caja a PDF
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireTenant } from "@/lib/security/tenant"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) {
      return tenantResult.response
    }
    const tenant = tenantResult.tenant

    const { id } = await params

    const closing = await prisma.cashClosing.findFirst({
      where: {
        id,
        businessId: tenant,
      },
    })

    if (!closing) {
      return NextResponse.json({ error: "Cierre no encontrado" }, { status: 404 })
    }

    return NextResponse.json(
      { error: "Exportación de cierre PDF pendiente de implementación" },
      { status: 501 },
    )
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
