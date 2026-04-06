/**
 * POST /api/users/stop-impersonate
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { requireTenant } from "@/lib/security/tenant"

export const runtime = "nodejs"

export async function POST() {
  try {
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response

    return NextResponse.json({
      success: true,
      message: "Modo impersonation desactivado",
    })
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
