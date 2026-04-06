import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { logAdminAction } from "@/lib/admin/logs"

export type SubscriptionStatus = "active" | "trial" | "past_due" | "canceled" | "expired"

export type AdminSubscriptionItem = {
  id: string
  user: string
  businessEmail: string
  plan: string
  planId: string
  price: number
  startDate: Date
  renewalDate: Date
  paymentMethod: string
  status: string
}

export type SubscriptionListResult = {
  items: AdminSubscriptionItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type SubscriptionListFilters = {
  page: number
  pageSize: number
  search?: string
  status?: "all" | SubscriptionStatus
}

export async function getAdminSubscriptions(filters: SubscriptionListFilters): Promise<SubscriptionListResult> {
  const where: Prisma.SubscriptionARSWhereInput = {}

  if (filters.search) {
    where.OR = [
      { business: { is: { name: { contains: filters.search, mode: "insensitive" } } } },
      { business: { is: { email: { contains: filters.search, mode: "insensitive" } } } },
      { plan: { is: { name: { contains: filters.search, mode: "insensitive" } } } },
    ]
  }

  if (filters.status && filters.status !== "all") {
    where.status = filters.status
  }

  const [total, rows] = await Promise.all([
    prisma.subscriptionARS.count({ where }),
    prisma.subscriptionARS.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
      include: {
        business: {
          select: {
            name: true,
            email: true,
            users: {
              where: {
                adminRole: {
                  in: ["admin", "super_admin"],
                },
              },
              select: {
                name: true,
                email: true,
              },
              take: 1,
            },
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
          },
        },
        payments: {
          select: {
            method: true,
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
  ])

  return {
    items: rows.map((row) => ({
      id: row.id,
      user: row.business.users[0]?.name || row.business.name,
      businessEmail: row.business.users[0]?.email || row.business.email,
      plan: row.plan.name,
      planId: row.plan.id,
      price: Number(row.totalMonthly),
      startDate: row.currentPeriodStart,
      renewalDate: row.currentPeriodEnd,
      paymentMethod: row.payments[0]?.method || "-",
      status: row.status,
    })),
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
  }
}

export async function changeSubscriptionPlan(params: {
  subscriptionId: string
  planId: string
  actorUserId?: string | null
}): Promise<void> {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: params.planId },
    select: {
      id: true,
      name: true,
      priceMonthly: true,
      priceYearly: true,
    },
  })

  if (!plan) {
    throw new Error("Plan no encontrado")
  }

  await prisma.subscriptionARS.update({
    where: { id: params.subscriptionId },
    data: {
      planId: plan.id,
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      totalMonthly: plan.priceMonthly,
      status: "active",
    },
  })

  await logAdminAction({
    actorUserId: params.actorUserId,
    event: "admin.subscription.change_plan",
    description: "Cambio de plan de suscripcion",
    metadata: {
      subscriptionId: params.subscriptionId,
      planId: plan.id,
      planName: plan.name,
    },
  })
}

export async function cancelSubscription(params: {
  subscriptionId: string
  actorUserId?: string | null
}): Promise<void> {
  await prisma.subscriptionARS.update({
    where: { id: params.subscriptionId },
    data: {
      status: "canceled",
      cancelAtPeriodEnd: true,
      canceledAt: new Date(),
    },
  })

  await logAdminAction({
    actorUserId: params.actorUserId,
    event: "admin.subscription.cancel",
    description: "Suscripcion cancelada desde panel admin",
    metadata: {
      subscriptionId: params.subscriptionId,
    },
    level: "warning",
  })
}

export async function extendSubscriptionTrial(params: {
  subscriptionId: string
  days: number
  actorUserId?: string | null
}): Promise<void> {
  const subscription = await prisma.subscriptionARS.findUnique({
    where: { id: params.subscriptionId },
    select: {
      trialEndsAt: true,
      currentPeriodEnd: true,
    },
  })

  if (!subscription) {
    throw new Error("Suscripcion no encontrada")
  }

  const baseDate = subscription.trialEndsAt ?? subscription.currentPeriodEnd
  const extendedDate = new Date(baseDate)
  extendedDate.setDate(extendedDate.getDate() + params.days)

  await prisma.subscriptionARS.update({
    where: { id: params.subscriptionId },
    data: {
      freeTrial: true,
      trialEndsAt: extendedDate,
      status: "trial",
    },
  })

  await logAdminAction({
    actorUserId: params.actorUserId,
    event: "admin.subscription.extend_trial",
    description: "Extension de trial",
    metadata: {
      subscriptionId: params.subscriptionId,
      days: params.days,
      trialEndsAt: extendedDate.toISOString(),
    },
  })
}
