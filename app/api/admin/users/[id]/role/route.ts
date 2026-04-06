import { NextRequest, NextResponse } from "next/server"
import { AdminRole } from "@prisma/client"
import { z } from "zod"
import { requireSuperAdminApiSession } from "@/lib/admin/api-auth"
import { updateUserAdminRole } from "@/services/admin/users.service"

const schema = z.object({
  adminRole: z.enum(["user", "admin", "super_admin"]),
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

    await updateUserAdminRole({
      userId: id,
      adminRole: parsed.adminRole as AdminRole,
      actorUserId: authResult.session.user.id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Payload invalido", details: error.issues }, { status: 400 })
    }

    const message = error instanceof Error ? error.message : "No se pudo actualizar el rol"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
