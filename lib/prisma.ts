import { PrismaClient } from '@prisma/client'
import { getTenantId } from '@/lib/tenant-context'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const tenantModels = [
  "Product",
  "ProductVariant",
  "VariantStock",
  "Sale",
  "SaleItem",
  "Purchase",
  "PurchaseItem",
  "Client",
  "ClientPayment",
  "ClientActivityLog",
  "Branch",
  "CashMovement",
  "StockMovement",
  "CashRegister",
]

const baseClient = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  errorFormat: 'pretty',
})

export const prisma = baseClient.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const tenantId = getTenantId()
        const argsWithSkip = args as any

        if (argsWithSkip?.__skipTenant) {
          delete argsWithSkip.__skipTenant
          return query(args)
        }

        if (!tenantId || !tenantModels.includes(model)) {
          return query(args)
        }

        const addWhere = () => {
          argsWithSkip.where = {
            ...argsWithSkip.where,
            businessId: tenantId,
          }
        }

        switch (operation) {
          case "findMany":
          case "findFirst":
          case "findUnique":
          case "count":
          case "aggregate":
          case "groupBy":
            addWhere()
            break
          case "create":
            argsWithSkip.data = {
              ...argsWithSkip.data,
              businessId: argsWithSkip.data?.businessId ?? tenantId,
            }
            break
          case "createMany":
            if (Array.isArray(argsWithSkip.data)) {
              argsWithSkip.data = argsWithSkip.data.map((d: any) => ({
                ...d,
                businessId: d?.businessId ?? tenantId,
              }))
            } else if (argsWithSkip.data) {
              argsWithSkip.data.businessId = argsWithSkip.data.businessId ?? tenantId
            }
            break
          case "update":
          case "updateMany":
          case "delete":
          case "deleteMany":
            addWhere()
            break
          case "upsert":
            argsWithSkip.where = {
              ...argsWithSkip.where,
              businessId: tenantId,
            }
            argsWithSkip.create = {
              ...argsWithSkip.create,
              businessId: argsWithSkip.create?.businessId ?? tenantId,
            }
            argsWithSkip.update = {
              ...argsWithSkip.update,
              businessId: argsWithSkip.update?.businessId ?? tenantId,
            }
            break
          default:
            break
        }

        return query(args)
      },
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma as any

// Manejar desconexión al finalizar
if (process.env.NODE_ENV !== 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}
