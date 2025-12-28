import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createClientSchema } from "@/lib/validations"
import { apiRateLimit } from "@/lib/rateLimit"
import { logger } from "@/lib/logger"

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Usuario sin negocio asignado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const hasDebt = searchParams.get('hasDebt') === 'true';
    const exceedsLimit = searchParams.get('exceedsLimit') === 'true';
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];

    const where: any = {
      businessId: session.user.businessId
    };

    // Filtros
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { taxId: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (hasDebt) {
      where.currentDebt = { gt: 0 };
    }

    if (exceedsLimit) {
      where.AND = [
        { currentDebt: { gt: 0 } },
        { creditLimit: { gt: 0 } }
      ];
    }

    if (tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          _count: {
            select: { sales: true }
          },
          sales: {
            select: {
              total: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.client.count({ where })
    ]);

    // Calcular métricas por cliente
    const clientsWithMetrics = await Promise.all(
      clients.map(async (client) => {
        const salesData = await prisma.sale.aggregate({
          where: { clientId: client.id },
          _sum: { total: true },
          _count: true
        });

        return {
          ...client,
          // Asegurar que los campos nuevos tengan valores por defecto
          status: client.status || 'ACTIVE',
          tags: client.tags || [],
          creditLimit: client.creditLimit || 0,
          currentDebt: client.currentDebt || 0,
          notes: client.notes || null,
          // Métricas calculadas
          totalPurchased: salesData._sum.total || 0,
          purchaseCount: salesData._count,
          averageTicket: salesData._count > 0 
            ? Number(salesData._sum.total) / salesData._count 
            : 0,
          lastPurchase: client.sales[0]?.createdAt || null
        };
      })
    );

    return NextResponse.json({
      clients: clientsWithMetrics,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error("Error fetching clients:", error);
    return NextResponse.json({ error: "Error al cargar clientes" }, { status: 500 });
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
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Usuario sin negocio asignado" }, { status: 401 })
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
        address: address?.trim() || null,
        businessId: session.user.businessId
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
