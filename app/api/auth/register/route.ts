import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createFreeTrial } from "@/lib/freeTrial";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    // Validar datos
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 400 }
      );
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario y negocio en transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear usuario
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "OWNER", // El primer usuario es dueño
        },
      });

      // Crear negocio básico
      const business = await tx.business.create({
        data: {
          name: `Negocio de ${name.split(" ")[0]}`,
          email,
          ownerId: user.id,
          planType: "PRO", // Empieza con PRO por el trial
        },
      });

      // Vincular usuario al negocio
      await tx.user.update({
        where: { id: user.id },
        data: { businessId: business.id },
      });

      return { user, business };
    });

    // Crear prueba gratuita
    const trialResult = await createFreeTrial(result.business.id);

    if (!trialResult.success) {
      console.error("Error al crear trial:", trialResult.error);
    }

    return NextResponse.json({
      success: true,
      userId: result.user.id,
      businessId: result.business.id,
      message: "Cuenta creada exitosamente. ¡Bienvenido a VendiMax!",
    });
  } catch (error: any) {
    console.error("[POST /api/auth/register]", error);
    return NextResponse.json(
      { error: "Error al crear la cuenta", details: error.message },
      { status: 500 }
    );
  }
}
