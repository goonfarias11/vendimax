import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdminApiSession } from "@/lib/admin/api-auth"
import { addInternalSupportMessage } from "@/services/admin/support.service"

const schema = z.object({
  message: z.string().min(5).max(2000),
})

export async function POST(
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

    await addInternalSupportMessage({
      ticketId: id,
      message: parsed.message,
      actorUserId: authResult.session.user.id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Payload invalido", details: error.issues }, { status: 400 })
    }

    const message = error instanceof Error ? error.message : "No se pudo crear el mensaje"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
