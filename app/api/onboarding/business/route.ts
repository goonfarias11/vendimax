import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { businessName, industry, address, taxId } = body;

    if (!businessName) {
      return NextResponse.json({ error: "El nombre del negocio es obligatorio" }, { status: 400 });
    }

    // Find user's business
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true },
    });

    if (!user || !user.business) {
      return NextResponse.json({ error: "No se encontró negocio asociado" }, { status: 404 });
    }

    const businessId = user.business.id;

    // Update business information
    await prisma.business.update({
      where: { id: businessId },
      data: {
        name: businessName,
        address: address || undefined,
        taxId: taxId || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      businessId,
      message: "Información guardada correctamente",
    });
  } catch (error) {
    console.error("Error en onboarding business:", error);
    return NextResponse.json({ error: "Error al guardar la información" }, { status: 500 });
  }
}
