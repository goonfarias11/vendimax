import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-middleware"
import { auditService, AUDIT_ENTITIES } from "@/lib/audit"

export const runtime = "nodejs"

const businessSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio").trim(),
  taxId: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  email: z.string().email("Email invÃ¡lido").trim(),
  logo: z.string().trim().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await requirePermission(request, ["settings:view", "settings:edit_business"])
    if (!permissionCheck.authorized) return permissionCheck.response!

    const session = await auth()
    const businessId = session?.user?.businessId
    if (!businessId) {
      return NextResponse.json({ error: "No autenticado o sin negocio asociado" }, { status: 401 })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        taxId: true,
        logo: true,
        planType: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 })
    }

    return NextResponse.json(business)
  } catch (error) {
    console.error("[business][GET]", error)
    return NextResponse.json({ error: "No se pudo obtener el negocio" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const permissionCheck = await requirePermission(request, "settings:edit_business")
    if (!permissionCheck.authorized) return permissionCheck.response!

    const session = await auth()
    const businessId = session?.user?.businessId
    if (!businessId || !session.user?.id) {
      return NextResponse.json({ error: "No autenticado o sin negocio asociado" }, { status: 401 })
    }

    const body = await request.json()
    const payload = businessSchema.parse(body)

    const previous = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        name: true,
        email: true,
        phone: true,
        address: true,
        taxId: true,
        logo: true,
      },
    })

    const updated = await prisma.business.update({
      where: { id: businessId },
      data: {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        address: payload.address,
        taxId: payload.taxId,
        logo: payload.logo,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        taxId: true,
        logo: true,
        updatedAt: true,
      },
    })

    if (previous) {
      await auditService.logUpdate(
        businessId,
        session.user.id,
        AUDIT_ENTITIES.BUSINESS,
        businessId,
        previous,
        updated
      )
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[business][PUT]", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos invÃ¡lidos", details: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })) },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: "No se pudo actualizar el negocio" }, { status: 500 })
  }
}
