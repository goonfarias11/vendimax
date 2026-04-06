// Minimal JS migration runner to avoid TS path/alias/runtime blockers
// Copies logic from migrateVariantStock.ts but uses a local PrismaClient instance.
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const variants = await prisma.productVariant.findMany({
    include: { product: { select: { businessId: true } } },
  })

  let migrated = 0

  for (const variant of variants) {
    const businessId = variant.product.businessId

    const mainWarehouse = await prisma.warehouse.findFirst({
      where: {
        branch: { businessId },
        isMain: true,
        isActive: true,
      },
    })

    if (!mainWarehouse) {
      console.warn(`No main warehouse for variant ${variant.id} (business ${businessId})`)
      continue
    }

    const stockValue = variant.stock ?? 0

    await prisma.variantStock.upsert({
      where: {
        variantId_warehouseId: {
          variantId: variant.id,
          warehouseId: mainWarehouse.id,
        },
      },
      update: {},
      create: {
        businessId,
        variantId: variant.id,
        warehouseId: mainWarehouse.id,
        stock: stockValue,
        available: stockValue,
      },
    })

    migrated++
  }

  console.log(`Migrated variant stock: ${migrated} variants`)
}

main()
  .then(() => {
    console.log("Migration completed")
    return prisma.$disconnect()
  })
  .catch(async (err) => {
    console.error("Migration error", err)
    await prisma.$disconnect()
    process.exit(1)
  })
