import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { verifyProductOwnership } from "@/lib/security/multi-tenant"
import { requirePermission, requireRole } from "@/lib/auth-middleware"
import { auditService, AUDIT_ENTITIES } from "@/lib/audit"
import { Prisma } from "@prisma/client"
import { requireTenant } from "@/lib/security/tenant"
import { productSchema } from "@/lib/validation/product.schema"

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Verificar permiso para ver productos
    const permissionCheck = await requirePermission(request, 'products:view')
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const businessId = tenantResult.tenant

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

    const where: Prisma.ProductWhereInput = {
      businessId,
      isActive: true
    }

    // Agregar búsqueda si se proporciona
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } }
      ]
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        variants: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            stock: true,
            isActive: true
          }
        },
        productStocks: {
          select: {
            stock: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      },
      take: limit
    })

    const formatted = products.map((p) => {
      // Calcular stock total desde ProductStock (suma de todos los warehouses)
      const totalStock = p.productStocks.reduce((sum, ps) => sum + ps.stock, 0)
      
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        description: p.description,
        price: Number(p.price),
        salePrice: Number(p.price), // Para compatibilidad con POS
        cost: Number(p.cost),
        stock: totalStock,
        minStock: p.minStock,
        maxStock: p.maxStock,
        categoryId: p.categoryId,
        category: p.category,
        image: p.image,
        unit: p.unit,
        taxRate: Number(p.taxRate),
        isActive: p.isActive,
        hasVariants: p.variants.length > 0,
        variants: p.variants.map((v) => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          salePrice: Number(v.price),
          stock: v.stock,
          isActive: v.isActive
        }))
      }
    })

    return NextResponse.json(formatted)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ 
      error: "Error al cargar productos",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar permiso para crear productos
    const permissionCheck = await requirePermission(request, 'products:create')
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response

    const currentSession = session ?? (await auth())
    if (!currentSession?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    requireRole(currentSession.user, ['OWNER', 'ADMIN', 'MANAGER'])
    const businessId = tenantResult.tenant

    const body = await request.json()
    const validatedData = productSchema.parse(body)
    const { stock: initialStock, ...productData } = validatedData

    // Verificar si el SKU ya existe en este negocio
    const existingSku = await prisma.product.findFirst({
      where: { 
        businessId,
        sku: validatedData.sku 
      }
    })

    if (existingSku) {
      return NextResponse.json(
        { error: "El SKU ya está en uso" },
        { status: 400 }
      )
    }

    // Verificar si el barcode ya existe en este negocio (si se proporciona)
    if (validatedData.barcode) {
      const existingBarcode = await prisma.product.findFirst({
        where: { 
          businessId,
          barcode: validatedData.barcode 
        }
      })

      if (existingBarcode) {
        return NextResponse.json(
          { error: "El código de barras ya está en uso" },
          { status: 400 }
        )
      }
    }

    const product = await prisma.product.create({
      data: {
        ...productData,
        businessId
      },
      include: {
        category: true
      }
    })

    // Auditoría: creación de producto
    await auditService.logCreate(
      businessId,
      currentSession.user.id,
      AUDIT_ENTITIES.PRODUCT,
      product.id,
      {
        name: product.name,
        sku: product.sku,
        price: product.price,
        cost: product.cost,
        minStock: product.minStock,
        categoryId: product.categoryId
      }
    )

    // Si se proporciona stock inicial, crear registro en ProductStock para el warehouse principal
    if (typeof initialStock === 'number') {
      // Buscar o crear warehouse principal
      let mainWarehouse = await prisma.warehouse.findFirst({
        where: {
          branch: {
            businessId
          },
          isMain: true,
          isActive: true
        }
      })

      // Si no existe warehouse principal, buscar el primer warehouse activo
      if (!mainWarehouse) {
        mainWarehouse = await prisma.warehouse.findFirst({
          where: {
            branch: {
              businessId
            },
            isActive: true
          }
        })
      }

      // Si no existe ningún warehouse, crear branch y warehouse por defecto
      if (!mainWarehouse) {
        // Buscar o crear branch principal
        let mainBranch = await prisma.branch.findFirst({
          where: {
            businessId,
            isMain: true
          }
        })

        if (!mainBranch) {
          mainBranch = await prisma.branch.create({
            data: {
              businessId,
              name: "Sucursal Principal",
              code: "MAIN",
              isMain: true,
              isActive: true
            }
          })
        }

        // Crear warehouse principal
        mainWarehouse = await prisma.warehouse.create({
          data: {
            branchId: mainBranch.id,
            name: "Almacén Principal",
            code: "MAIN",
            isMain: true,
            isActive: true
          }
        })
      }

      // Crear o actualizar ProductStock
      if (mainWarehouse) {
        await prisma.productStock.upsert({
          where: {
            productId_warehouseId: {
              productId: product.id,
              warehouseId: mainWarehouse.id
            }
          },
          create: {
            productId: product.id,
            warehouseId: mainWarehouse.id,
            stock: initialStock,
            available: initialStock
          },
          update: {
            stock: initialStock,
            available: initialStock
          }
        })
      }
    }

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)

    if ((error as Error & { status?: number }).status === 403) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response

    const currentSession = session ?? (await auth())
    if (!currentSession?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    requireRole(currentSession.user, ['OWNER', 'ADMIN', 'MANAGER'])
    const businessId = tenantResult.tenant

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID de producto requerido" },
        { status: 400 }
      )
    }

    // Verificar que el producto pertenezca al negocio
    await verifyProductOwnership(id, businessId)

    const body = await request.json()
    const validatedData = productSchema.parse(body)
    const { stock: newStock, ...productData } = validatedData

    // Verificar si el SKU ya está en uso por otro producto del mismo negocio
    const existingSku = await prisma.product.findFirst({
      where: {
        businessId,
        sku: validatedData.sku,
        id: { not: id }
      }
    })

    if (existingSku) {
      return NextResponse.json(
        { error: "El SKU ya está en uso" },
        { status: 400 }
      )
    }

    const previous = await prisma.product.findUnique({
      where: { id },
      select: {
        name: true,
        sku: true,
        price: true,
        cost: true,
        minStock: true,
        maxStock: true,
        taxRate: true,
        isActive: true,
        categoryId: true
      }
    })

    const product = await prisma.product.update({
      where: { id },
      data: productData,
      include: {
        category: true
      }
    })

    // Si se proporciona stock, actualizar ProductStock en warehouse principal
    if (typeof newStock === 'number') {
      // Buscar warehouse principal
      let mainWarehouse = await prisma.warehouse.findFirst({
        where: {
          branch: {
            businessId
          },
          isMain: true,
          isActive: true
        }
      })

      // Si no existe warehouse principal, buscar el primer warehouse activo
      if (!mainWarehouse) {
        mainWarehouse = await prisma.warehouse.findFirst({
          where: {
            branch: {
              businessId
            },
            isActive: true
          }
        })
      }

      // Si no existe ningún warehouse, crear branch y warehouse por defecto
      if (!mainWarehouse) {
        // Buscar o crear branch principal
        let mainBranch = await prisma.branch.findFirst({
          where: {
            businessId,
            isMain: true
          }
        })

        if (!mainBranch) {
          mainBranch = await prisma.branch.create({
            data: {
              businessId,
              name: "Sucursal Principal",
              code: "MAIN",
              isMain: true,
              isActive: true
            }
          })
        }

        // Crear warehouse principal
        mainWarehouse = await prisma.warehouse.create({
          data: {
            branchId: mainBranch.id,
            name: "Almacén Principal",
            code: "MAIN",
            isMain: true,
            isActive: true
          }
        })
      }

      // Crear o actualizar ProductStock
      if (mainWarehouse) {
        await prisma.productStock.upsert({
          where: {
            productId_warehouseId: {
              productId: id,
              warehouseId: mainWarehouse.id
            }
          },
          create: {
            productId: id,
            warehouseId: mainWarehouse.id,
            stock: newStock,
            available: newStock
          },
          update: {
            stock: newStock,
            available: newStock
          }
        })
      }
    }

    // Auditoría: actualización de producto
    if (previous) {
      await auditService.logUpdate(
        businessId,
        currentSession.user.id,
        AUDIT_ENTITIES.PRODUCT,
        product.id,
        previous,
        {
          name: product.name,
          sku: product.sku,
          price: product.price,
          cost: product.cost,
          minStock: product.minStock,
          maxStock: product.maxStock,
          taxRate: product.taxRate,
          isActive: product.isActive,
          categoryId: product.categoryId
        }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error updating product:", error)

    if ((error as Error & { status?: number }).status === 403) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response

    const currentSession = session ?? (await auth())
    if (!currentSession?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    requireRole(currentSession.user, ['OWNER', 'ADMIN', 'MANAGER'])
    const businessId = tenantResult.tenant

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID de producto requerido" },
        { status: 400 }
      )
    }

    // Verificar que el producto pertenezca al negocio
    await verifyProductOwnership(id, businessId)

    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        cost: true,
        minStock: true,
        categoryId: true,
        isActive: true
      }
    })

    // Soft delete
    await prisma.product.update({
      where: { id },
      data: { isActive: false }
    })

    if (product) {
      await auditService.logDelete(
        businessId,
        currentSession.user.id,
        AUDIT_ENTITIES.PRODUCT,
        product.id,
        product
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting product:", error)

    if ((error as Error & { status?: number }).status === 403) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ error: "Error al eliminar producto" }, { status: 500 })
  }
}
