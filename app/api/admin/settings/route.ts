import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireSuperAdminApiSession } from "@/lib/admin/api-auth"
import { updateAdminSettings } from "@/services/admin/settings.service"

const planSchema = z.object({
  id: z.string().min(1),
  priceMonthly: z.number().nonnegative().optional(),
  priceYearly: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
})

const schema = z.object({
  platformName: z.string().min(2).max(120).optional(),
  featureFlags: z.record(z.string(), z.unknown()).optional(),
  emailSystem: z.record(z.string(), z.unknown()).optional(),
  plans: z.array(planSchema).optional(),
})

export async function PATCH(request: NextRequest) {
  const authResult = await requireSuperAdminApiSession()
  if (!authResult.authorized) {
    return authResult.response
  }

  try {
    const body = await request.json()
    const parsed = schema.parse(body)

    await updateAdminSettings(parsed, authResult.session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Payload invalido", details: error.issues }, { status: 400 })
    }

    const message = error instanceof Error ? error.message : "No se pudo guardar la configuracion"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
