import { NextResponse } from "next/server"
import { hash } from "bcrypt"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    // Validaciones
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Todos los campos son requeridos" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      )
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: "El email ya está registrado" },
        { status: 400 }
      )
    }

    // Hashear la contraseña
    const passwordHash = await hash(password, 10)

    // Crear el usuario
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "VENDEDOR" // Rol por defecto
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    return NextResponse.json(
      {
        message: "Usuario creado exitosamente",
        user
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error al registrar usuario:", error)
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
