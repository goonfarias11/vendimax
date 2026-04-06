import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { requireTenant } from "@/lib/security/tenant"
import { Prisma } from "@prisma/client"

export const runtime = "nodejs"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant

    const client = await prisma.client.findFirst({
      where: {
        id,
        businessId: tenant,
      },
    })

    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action") || ""
    const limit = parseInt(searchParams.get("limit") || "50")

    const where: Prisma.ClientActivityLogWhereInput = {
      clientId: id,
      client: {
        businessId: tenant,
      },
    }

    if (action) {
      where.action = action
    }

    const activityLogs = await prisma.clientActivityLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return NextResponse.json(activityLogs)
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
