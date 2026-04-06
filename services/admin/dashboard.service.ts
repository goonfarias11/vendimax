import { prisma } from "@/lib/prisma"

type ChartPoint = {
  label: string
  value: number
}

type ConversionPoint = {
  label: string
  free: number
  paid: number
  conversionRate: number
}

export type DashboardMetrics = {
  totals: {
    totalUsers: number
    activeUsers: number
    payingUsers: number
    monthlyRecurringRevenue: number
    newUsersToday: number
    openSupportTickets: number
  }
  charts: {
    userGrowth: ChartPoint[]
    monthlyRevenue: ChartPoint[]
    freeToPaidConversion: ConversionPoint[]
  }
}

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat("es-AR", {
  month: "short",
})

function toMonthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${date.getUTCMonth()}`
}

function getMonthBuckets(months: number): { key: string; label: string }[] {
  const now = new Date()
  const buckets: { key: string; label: string }[] = []

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1))
    buckets.push({
      key: toMonthKey(date),
      label: `${MONTH_LABEL_FORMATTER.format(date)} ${date.getUTCFullYear()}`,
    })
  }

  return buckets
}

export async function getAdminNotificationCount(): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [urgentTickets, criticalLogs] = await Promise.all([
    prisma.supportTicket
      .count({
        where: {
          status: {
            in: ["open", "pending"],
          },
          priority: "urgent",
        },
      })
      .catch((error) => {
        console.warn(
          "No se pudo consultar support tickets para notificaciones admin:",
          (error as Error)?.message ?? String(error)
        )
        return 0
      }),
    prisma.systemLog
      .count({
        where: {
          createdAt: { gte: since },
          level: { in: ["critical", "error"] },
        },
      })
      .catch((error) => {
        console.warn(
          "No se pudo consultar system logs para notificaciones admin:",
          (error as Error)?.message ?? String(error)
        )
        return 0
      }),
  ])

  return urgentTickets + criticalLogs
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const chartMonths = 6
  const buckets = getMonthBuckets(chartMonths)
  const firstBucketDate = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - (chartMonths - 1), 1))

  const [
    totalUsers,
    activeUsers,
    payingUsers,
    mrrSum,
    newUsersToday,
    openSupportTickets,
    usersByDate,
    paidPayments,
    businesses,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({
      where: {
        business: {
          is: {
            subscriptionARS: {
              is: {
                status: "active",
              },
            },
          },
        },
      },
    }),
    prisma.subscriptionARS.aggregate({
      where: { status: "active" },
      _sum: { totalMonthly: true },
    }),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.supportTicket
      .count({
        where: {
          status: {
            in: ["open", "pending"],
          },
        },
      })
      .catch((error) => {
        console.warn(
          "No se pudo consultar support tickets para métricas admin:",
          (error as Error)?.message ?? String(error)
        )
        return 0
      }),
    prisma.user.findMany({
      where: {
        createdAt: { gte: firstBucketDate },
      },
      select: { createdAt: true },
    }),
    prisma.payment.findMany({
      where: {
        status: { in: ["approved", "paid"] },
        createdAt: { gte: firstBucketDate },
      },
      select: {
        amount: true,
        createdAt: true,
      },
    }),
    prisma.business.findMany({
      where: {
        createdAt: { gte: firstBucketDate },
      },
      select: {
        createdAt: true,
        subscriptionARS: {
          select: {
            status: true,
          },
        },
      },
    }),
  ])

  const usersByBucket = new Map<string, number>()
  const revenueByBucket = new Map<string, number>()
  const freeByBucket = new Map<string, number>()
  const paidByBucket = new Map<string, number>()

  usersByDate.forEach((item) => {
    const key = toMonthKey(item.createdAt)
    usersByBucket.set(key, (usersByBucket.get(key) ?? 0) + 1)
  })

  paidPayments.forEach((payment) => {
    const key = toMonthKey(payment.createdAt)
    const current = revenueByBucket.get(key) ?? 0
    revenueByBucket.set(key, current + Number(payment.amount))
  })

  businesses.forEach((business) => {
    const key = toMonthKey(business.createdAt)
    freeByBucket.set(key, (freeByBucket.get(key) ?? 0) + 1)

    if (business.subscriptionARS && ["active", "past_due"].includes(business.subscriptionARS.status)) {
      paidByBucket.set(key, (paidByBucket.get(key) ?? 0) + 1)
    }
  })

  const userGrowth: ChartPoint[] = buckets.map((bucket) => ({
    label: bucket.label,
    value: usersByBucket.get(bucket.key) ?? 0,
  }))

  const monthlyRevenue: ChartPoint[] = buckets.map((bucket) => ({
    label: bucket.label,
    value: Math.round(revenueByBucket.get(bucket.key) ?? 0),
  }))

  const freeToPaidConversion: ConversionPoint[] = buckets.map((bucket) => {
    const free = freeByBucket.get(bucket.key) ?? 0
    const paid = paidByBucket.get(bucket.key) ?? 0

    return {
      label: bucket.label,
      free,
      paid,
      conversionRate: free > 0 ? Number(((paid / free) * 100).toFixed(2)) : 0,
    }
  })

  return {
    totals: {
      totalUsers,
      activeUsers,
      payingUsers,
      monthlyRecurringRevenue: Number(mrrSum._sum.totalMonthly ?? 0),
      newUsersToday,
      openSupportTickets,
    },
    charts: {
      userGrowth,
      monthlyRevenue,
      freeToPaidConversion,
    },
  }
}
