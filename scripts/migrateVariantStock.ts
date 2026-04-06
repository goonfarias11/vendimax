import { prisma } from "@/lib/prisma"

async function main() {
  const variants = await prisma.productVariant.findMany({
    include: {
      product: {
        select: { businessId: true },
      },
    },
  })

  let migrated = 0

  for (const variant of variants) {
    const businessId = variant.product.businessId

    const mainWarehouse = await prisma.warehouse.findFirst({
      where: {
        branch: {
          businessId,
        },
        isMain: true,
        isActive: true,
      },
    })

    if (!mainWarehouse) {
      console.warn(`No main warehouse for variant ${variant.id} (business ${businessId})`)
      continue
    }

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
        stock: (variant as any).stock ?? 0,
        available: (variant as any).stock ?? 0,
      },
    })

    migrated++
  }

  console.log(`Migrated variant stock: ${migrated} variants`)
}

main()
  .then(() => {
    console.log("Migration completed")
    process.exit(0)
  })
  .catch((err) => {
    console.error("Migration error", err)
    process.exit(1)
  })
