import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createClientSchema } from "@/lib/validations"
import { apiRateLimit } from "@/lib/rateLimit"
import { logger } from "@/lib/logger"

export const runtime = 'nodejs'

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(clients)
  } catch (error) {
    logger.error("Error fetching clients:", error)
    return NextResponse.json({ error: "Error al cargar clientes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "127.0.0.1"
    const { success } = await apiRateLimit(ip)
    
    if (!success) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo más tarde." },
        { status: 429 }
      )
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()

    // Validación con Zod
    const result = createClientSchema.safeParse(body)
    
    if (!result.success) {
      const firstError = result.error.issues[0]
      return NextResponse.json(
        { 
          error: firstError.message,
          details: result.error.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    const { name, email, phone, address } = result.data

    const client = await prisma.client.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null
      }
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error: any) {
    logger.error("Error creating client:", error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Ya existe un cliente con ese email" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "Error al crear el cliente" },
      { status: 500 }
    )
  }
}
