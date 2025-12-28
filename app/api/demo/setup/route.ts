import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcrypt';

// API para crear un entorno demo
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resetKey = searchParams.get('key');

    // Protección: solo permitir con clave secreta
    if (resetKey !== process.env.DEMO_RESET_KEY) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Eliminar todos los datos del demo anterior
    const demoBusinesses = await prisma.business.findMany({
      where: { isDemo: true },
    });

    for (const business of demoBusinesses) {
      // Eliminar en orden para respetar foreign keys
      await prisma.saleItem.deleteMany({
        where: {
          sale: {
            user: {
              businessId: business.id,
            },
          },
        },
      });

      await prisma.sale.deleteMany({
        where: {
          user: {
            businessId: business.id,
          },
        },
      });

      await prisma.cashClosing.deleteMany({
        where: {
          responsible: {
            businessId: business.id,
          },
        },
      });

      await prisma.cashMovement.deleteMany({
        where: {
          user: {
            businessId: business.id,
          },
        },
      });

      await prisma.product.deleteMany({});
      await prisma.category.deleteMany({});
      await prisma.client.deleteMany({});
      await prisma.user.deleteMany({
        where: { businessId: business.id },
      });

      await prisma.subscription.deleteMany({
        where: { businessId: business.id },
      });

      await prisma.invoice.deleteMany({
        where: { businessId: business.id },
      });

      await prisma.business.delete({
        where: { id: business.id },
      });
    }

    // Primero crear el usuario demo (sin businessId)
    const demoUser = await prisma.user.create({
      data: {
        name: 'Usuario Demo',
        email: 'demo@vendimax.com',
        passwordHash: await hash('demo123', 10),
        role: 'ADMIN',
      },
    });

    // Crear negocio demo con el usuario como owner
    const demoBusiness = await prisma.business.create({
      data: {
        name: 'Demo Store',
        email: 'demo@vendimax.com',
        phone: '+54 11 1234-5678',
        address: 'Av. Corrientes 1234, CABA',
        taxId: '20-12345678-9',
        ownerId: demoUser.id,
        planType: 'PRO',
        isDemo: true,
      },
    });

    // Actualizar el usuario con el businessId
    await prisma.user.update({
      where: { id: demoUser.id },
      data: { businessId: demoBusiness.id },
    });

    // Crear categorías
    const categories = await prisma.category.createMany({
      data: [
        { name: 'Electrónica', description: 'Productos electrónicos' },
        { name: 'Ropa', description: 'Indumentaria' },
        { name: 'Alimentos', description: 'Productos alimenticios' },
        { name: 'Hogar', description: 'Artículos para el hogar' },
      ],
    });

    const electronicaCategory = await prisma.category.findFirst({
      where: { name: 'Electrónica' },
    });

    const ropaCategory = await prisma.category.findFirst({
      where: { name: 'Ropa' },
    });

    const alimentosCategory = await prisma.category.findFirst({
      where: { name: 'Alimentos' },
    });

    // Crear productos
    await prisma.product.createMany({
      data: [
        {
          businessId: demoBusiness.id,
          name: 'Mouse Inalámbrico',
          sku: 'MOUSE-001',
          barcode: '7798123456789',
          description: 'Mouse inalámbrico ergonómico',
          price: 15000,
          cost: 9000,
          stock: 25,
          minStock: 5,
          categoryId: electronicaCategory?.id,
          unit: 'unidad',
          taxRate: 21,
        },
        {
          businessId: demoBusiness.id,
          name: 'Teclado Mecánico',
          sku: 'TECLADO-001',
          barcode: '7798123456790',
          price: 35000,
          cost: 20000,
          stock: 15,
          minStock: 3,
          categoryId: electronicaCategory?.id,
          unit: 'unidad',
          taxRate: 21,
        },
        {
          businessId: demoBusiness.id,
          name: 'Remera Básica',
          sku: 'REMERA-001',
          barcode: '7798123456791',
          price: 8000,
          cost: 4000,
          stock: 50,
          minStock: 10,
          categoryId: ropaCategory?.id,
          unit: 'unidad',
          taxRate: 21,
        },
        {
          businessId: demoBusiness.id,
          name: 'Jean Clásico',
          sku: 'JEAN-001',
          barcode: '7798123456792',
          price: 18000,
          cost: 10000,
          stock: 30,
          minStock: 8,
          categoryId: ropaCategory?.id,
          unit: 'unidad',
          taxRate: 21,
        },
        {
          businessId: demoBusiness.id,
          name: 'Café Molido 500g',
          sku: 'CAFE-001',
          barcode: '7798123456793',
          price: 5000,
          cost: 3000,
          stock: 100,
          minStock: 20,
          categoryId: alimentosCategory?.id,
          unit: 'unidad',
          taxRate: 10.5,
        },
        {
          businessId: demoBusiness.id,
          name: 'Leche Entera 1L',
          sku: 'LECHE-001',
          barcode: '7798123456794',
          price: 1500,
          cost: 900,
          stock: 80,
          minStock: 30,
          categoryId: alimentosCategory?.id,
          unit: 'unidad',
          taxRate: 10.5,
        },
      ],
    });

    // Crear clientes
    await prisma.client.createMany({
      data: [
        {
          name: 'Juan Pérez',
          email: 'juan@example.com',
          phone: '+54 11 9876-5432',
          address: 'Av. Santa Fe 2000',
          taxId: '20-98765432-1',
        },
        {
          name: 'María González',
          email: 'maria@example.com',
          phone: '+54 11 5555-1234',
          address: 'Calle Falsa 123',
          taxId: '27-55555555-5',
        },
        {
          name: 'Carlos Rodríguez',
          phone: '+54 11 4444-9999',
        },
      ],
    });

    // Crear algunas ventas de ejemplo
    const mouse = await prisma.product.findFirst({ where: { sku: 'MOUSE-001', businessId: demoBusiness.id } });
    const teclado = await prisma.product.findFirst({ where: { sku: 'TECLADO-001', businessId: demoBusiness.id } });
    const cliente1 = await prisma.client.findFirst({ where: { name: 'Juan Pérez' } });
    const cliente2 = await prisma.client.findFirst({ where: { name: 'María González' } });

    if (mouse && cliente1) {
      const sale1 = await prisma.sale.create({
        data: {
          userId: demoUser.id,
          clientId: cliente1.id,
          paymentMethod: 'EFECTIVO',
          subtotal: 15000,
          total: 15000,
          status: 'COMPLETADO',
          saleItems: {
            create: [
              {
                productId: mouse.id,
                quantity: 1,
                price: 15000,
                subtotal: 15000,
              },
            ],
          },
        },
      });
    }

    if (teclado && cliente2) {
      const sale2 = await prisma.sale.create({
        data: {
          userId: demoUser.id,
          clientId: cliente2.id,
          paymentMethod: 'TARJETA_DEBITO',
          subtotal: 35000,
          total: 35000,
          status: 'COMPLETADO',
          saleItems: {
            create: [
              {
                productId: teclado.id,
                quantity: 1,
                price: 35000,
                subtotal: 35000,
              },
            ],
          },
        },
      });
    }

    // Crear movimiento de apertura de caja
    await prisma.cashMovement.create({
      data: {
        type: 'APERTURA',
        amount: 10000,
        description: 'Apertura de caja inicial',
        userId: demoUser.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Entorno demo creado correctamente',
      credentials: {
        email: 'demo@vendimax.com',
        password: 'demo123',
      },
      businessId: demoBusiness.id,
    });
  } catch (error) {
    console.error('Error creando entorno demo:', error);
    return NextResponse.json(
      { error: 'Error al crear entorno demo' },
      { status: 500 }
    );
  }
}

// Endpoint para obtener información del demo
export async function GET() {
  try {
    const demoBusiness = await prisma.business.findFirst({
      where: { isDemo: true },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!demoBusiness) {
      return NextResponse.json({
        exists: false,
        message: 'No hay entorno demo activo',
      });
    }

    const [productCount, clientCount, salesCount] = await Promise.all([
      prisma.product.count(),
      prisma.client.count(),
      prisma.sale.count({
        where: {
          user: {
            businessId: demoBusiness.id,
          },
        },
      }),
    ]);

    return NextResponse.json({
      exists: true,
      business: {
        id: demoBusiness.id,
        name: demoBusiness.name,
        planType: demoBusiness.planType,
      },
      stats: {
        users: demoBusiness._count.users,
        products: productCount,
        clients: clientCount,
        sales: salesCount,
      },
      credentials: {
        email: 'demo@vendimax.com',
        password: 'demo123',
      },
    });
  } catch (error) {
    console.error('Error obteniendo info de demo:', error);
    return NextResponse.json(
      { error: 'Error al obtener información del demo' },
      { status: 500 }
    );
  }
}
