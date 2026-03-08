/**
 * API para salir del modo impersonation
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export const runtime = 'nodejs'

/**
 * POST /api/users/stop-impersonate
 * Permite a un ADMIN salir del modo impersonation
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    // El cliente se encargará de limpiar los datos de impersonation
    return NextResponse.json({
      success: true,
      message: "Modo impersonation desactivado"
    })

  } catch (error) {
    console.error("Error al salir de impersonation:", error)
    return NextResponse.json(
      { error: "Error al salir del modo impersonation" },
      { status: 500 }
    )
  }
}
