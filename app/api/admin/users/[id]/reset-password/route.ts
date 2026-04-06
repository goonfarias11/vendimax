import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireSuperAdminApiSession } from "@/lib/admin/api-auth"
import { resetUserPassword } from "@/services/admin/users.service"

export const runtime = "nodejs"

const schema = z.object({
  newPassword: z.string().min(8),
})

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireSuperAdminApiSession()
  if (!authResult.authorized) {
    return authResult.response
  }

  try {
    const body = await request.json()
    const parsed = schema.parse(body)
    const { id } = await context.params

    await resetUserPassword({
      userId: id,
      newPassword: parsed.newPassword,
      actorUserId: authResult.session.user.id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Payload invalido", details: error.issues }, { status: 400 })
    }

    const message = error instanceof Error ? error.message : "No se pudo resetear la password"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
