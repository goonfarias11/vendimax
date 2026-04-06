import { prisma } from "@/lib/prisma"
import { getDashboardMetrics } from "@/services/admin/dashboard.service"

export type SaasAnalytics = {
  mrr: number
  churnRate: number
  lifetimeValue: number
  cac: number
  conversionRate: number
  activeSubscriptions: number
}

export async function getSaasAnalytics(): Promise<SaasAnalytics> {
  const [
    activeSubscriptions,
    canceledLast30,
    mrrSum,
    totalUsers,
    payingUsers,
    newPayingUsers,
  ] = await Promise.all([
    prisma.subscriptionARS.count({
      where: { status: "active" },
    }),
    prisma.subscriptionARS.count({
      where: {
        status: "canceled",
        canceledAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.subscriptionARS.aggregate({
      where: { status: "active" },
      _sum: { totalMonthly: true },
    }),
    prisma.user.count(),
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
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
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
  ])

  const mrr = Number(mrrSum._sum.totalMonthly ?? 0)
  const churnRate = activeSubscriptions + canceledLast30 > 0
    ? Number(((canceledLast30 / (activeSubscriptions + canceledLast30)) * 100).toFixed(2))
    : 0

  const arpu = activeSubscriptions > 0 ? mrr / activeSubscriptions : 0
  const lifetimeValue = churnRate > 0 ? Number((arpu / (churnRate / 100)).toFixed(2)) : 0

  const estimatedMarketingSpend = Number(process.env.ADMIN_MARKETING_SPEND_MONTHLY ?? "0")
  const cac = newPayingUsers > 0 ? Number((estimatedMarketingSpend / newPayingUsers).toFixed(2)) : 0

  const conversionRate = totalUsers > 0 ? Number(((payingUsers / totalUsers) * 100).toFixed(2)) : 0

  return {
    mrr,
    churnRate,
    lifetimeValue,
    cac,
    conversionRate,
    activeSubscriptions,
  }
}

export async function getAnalyticsTrends() {
  const dashboard = await getDashboardMetrics()
  return {
    userGrowth: dashboard.charts.userGrowth,
    revenue: dashboard.charts.monthlyRevenue,
    conversion: dashboard.charts.freeToPaidConversion,
  }
}
