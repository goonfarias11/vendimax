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

    // Find user's business
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true },
    });

    if (!user || !user.business) {
      return NextResponse.json({ error: "No se encontró negocio asociado" }, { status: 404 });
    }

    const businessId = user.business.id;

    // Create demo data in a transaction
    await prisma.$transaction(async (tx) => {
      // Create demo category
      const demoCategory = await tx.category.create({
        data: {
          name: "Productos Demo",
          description: "Categoría de ejemplo para comenzar",
        },
      });

      // Create demo product with unique SKU
      const demoSku = `DEMO-${businessId.slice(-6)}`;
      
      const existingProduct = await tx.product.findUnique({
        where: { sku: demoSku },
      });

      if (!existingProduct) {
        await tx.product.create({
          data: {
            name: "Producto de Ejemplo",
            sku: demoSku,
            price: 1000,
            cost: 500,
            stock: 100,
            categoryId: demoCategory.id,
            isActive: true,
          },
        });
      }

      // Create demo vendor user (if not exists)
      const existingVendor = await tx.user.findFirst({
        where: {
          businessId,
          role: "VENDEDOR",
        },
      });

      if (!existingVendor) {
        await tx.user.create({
          data: {
            name: "Vendedor Demo",
            email: `vendedor.demo.${businessId.slice(-6)}@vendimax.com`,
            passwordHash: "demo_no_access", // No password - demo only
            role: "VENDEDOR",
            businessId,
            isActive: false, // Inactive demo user
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Configuración completada con éxito",
    });
  } catch (error) {
    console.error("Error en onboarding complete:", error);
    return NextResponse.json({ error: "Error al completar configuración" }, { status: 500 });
  }
}
