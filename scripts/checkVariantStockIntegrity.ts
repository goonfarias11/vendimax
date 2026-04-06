import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

async function main() {
  const issues: string[] = []

  // Variantes sin VariantStock
  const variantsWithoutStock = await prisma.productVariant.findMany({
    where: {
      variantStocks: { none: {} },
    },
    include: { product: { select: { businessId: true } } },
  })
  if (variantsWithoutStock.length) {
    issues.push(`Variants without VariantStock: ${variantsWithoutStock.length}`)
  }

  // Duplicados (violados sólo si unique falla), búsqueda defensiva
  const dupes = await prisma.$queryRawUnsafe<
    { variantid: string; warehouseid: string; count: bigint }[]
  >(`SELECT variant_id as variantId, warehouse_id as warehouseId, COUNT(*) as count
      FROM variant_stocks
      GROUP BY variant_id, warehouse_id
      HAVING COUNT(*) > 1`)
  if (dupes.length) {
    issues.push(`Duplicate variant+warehouse pairs: ${dupes.length}`)
  }

  // available > stock
  const badAvailability = await prisma.variantStock.findMany({
    where: {
      available: { gt: 0 },
      AND: [{ available: { gt: 0 } }],
    },
    // Note: Prisma decimal compare limited; we can check available > stock via raw
  })
  // Raw to be precise
  const badAvailRaw = await prisma.$queryRawUnsafe<
    { id: string; stock: number; available: number }[]
  >(`SELECT id, stock, available FROM variant_stocks WHERE available > stock`)
  if (badAvailRaw.length) {
    issues.push(`VariantStock with available > stock: ${badAvailRaw.length}`)
  }

  if (!issues.length) {
    console.log("VariantStock integrity: OK")
  } else {
    console.warn("VariantStock integrity issues:")
    issues.forEach((i) => console.warn("- ", i))
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
