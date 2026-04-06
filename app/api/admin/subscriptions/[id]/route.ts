import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdminApiSession } from "@/lib/admin/api-auth"
import {
  cancelSubscription,
  changeSubscriptionPlan,
  extendSubscriptionTrial,
} from "@/services/admin/subscriptions.service"

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("change_plan"),
    planId: z.string().min(1),
  }),
  z.object({
    action: z.literal("cancel"),
  }),
  z.object({
    action: z.literal("extend_trial"),
    days: z.number().int().min(1).max(90),
  }),
])

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdminApiSession()
  if (!authResult.authorized) {
    return authResult.response
  }

  try {
    const body = await request.json()
    const parsed = schema.parse(body)
    const { id } = await context.params

    if (parsed.action === "change_plan") {
      await changeSubscriptionPlan({
        subscriptionId: id,
        planId: parsed.planId,
        actorUserId: authResult.session.user.id,
      })
    }

    if (parsed.action === "cancel") {
      await cancelSubscription({
        subscriptionId: id,
        actorUserId: authResult.session.user.id,
      })
    }

    if (parsed.action === "extend_trial") {
      await extendSubscriptionTrial({
        subscriptionId: id,
        days: parsed.days,
        actorUserId: authResult.session.user.id,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Payload invalido", details: error.issues }, { status: 400 })
    }

    const message = error instanceof Error ? error.message : "No se pudo actualizar la suscripcion"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
