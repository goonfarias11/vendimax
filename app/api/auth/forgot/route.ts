import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = (body?.email || "").toString().trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 })
    }

    // Funcionalidad de recuperación no configurada (sin SMTP / token store)
    return NextResponse.json(
      {
        message:
          "Recuperación de contraseña pendiente de configuración. Contacta al administrador para restablecer tu acceso.",
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json({ error: "No se pudo procesar la solicitud" }, { status: 500 })
  }
}
