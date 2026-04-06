import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export type PaymentListFilters = {
  page: number
  pageSize: number
  status?: string
  method?: string
  from?: string
  to?: string
}

export type AdminPaymentItem = {
  id: string
  user: string
  amount: number
  currency: string
  method: string
  status: string
  date: Date
}

export type PaymentListResult = {
  items: AdminPaymentItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

function getDateRange(from?: string, to?: string): Prisma.DateTimeFilter | undefined {
  if (!from && !to) {
    return undefined
  }

  return {
    gte: from ? new Date(from) : undefined,
    lte: to ? new Date(to) : undefined,
  }
}

export async function getAdminPayments(filters: PaymentListFilters): Promise<PaymentListResult> {
  const where: Prisma.PaymentWhereInput = {}
  const dateRange = getDateRange(filters.from, filters.to)

  if (filters.status && filters.status !== "all") {
    where.status = filters.status
  }

  if (filters.method && filters.method !== "all") {
    where.method = filters.method
  }

  if (dateRange) {
    where.createdAt = dateRange
  }

  const [total, rows] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
      include: {
        subscription: {
          include: {
            business: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    }),
  ])

  return {
    items: rows.map((row) => ({
      id: row.id,
      user: row.subscription.business.name || row.subscription.business.email,
      amount: Number(row.amount),
      currency: row.currency,
      method: row.method,
      status: row.status,
      date: row.paidAt ?? row.createdAt,
    })),
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
  }
}

function escapeCsv(value: string | number): string {
  const text = String(value)
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replace(/\"/g, '""')}"`
  }
  return text
}

export async function exportAdminPaymentsCsv(filters: Omit<PaymentListFilters, "page" | "pageSize">): Promise<string> {
  const where: Prisma.PaymentWhereInput = {}
  const dateRange = getDateRange(filters.from, filters.to)

  if (filters.status && filters.status !== "all") {
    where.status = filters.status
  }

  if (filters.method && filters.method !== "all") {
    where.method = filters.method
  }

  if (dateRange) {
    where.createdAt = dateRange
  }

  const rows = await prisma.payment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      subscription: {
        include: {
          business: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  })

  const header = ["payment_id", "user", "amount", "currency", "method", "status", "date"]
  const lines = rows.map((row) => {
    const userName = row.subscription.business.name || row.subscription.business.email
    const date = row.paidAt ?? row.createdAt

    return [
      escapeCsv(row.id),
      escapeCsv(userName),
      escapeCsv(Number(row.amount).toFixed(2)),
      escapeCsv(row.currency),
      escapeCsv(row.method),
      escapeCsv(row.status),
      escapeCsv(date.toISOString()),
    ].join(",")
  })

  return [header.join(","), ...lines].join("\n")
}
