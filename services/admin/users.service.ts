import { AdminRole, type Prisma } from "@prisma/client"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { logAdminAction } from "@/lib/admin/logs"

export type AdminUserItem = {
  id: string
  name: string
  email: string
  company: string
  role: string
  adminRole: AdminRole
  plan: string
  status: "active" | "suspended"
  createdAt: Date
  lastLogin: Date | null
}

export type UserListResult = {
  items: AdminUserItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type UserListFilters = {
  page: number
  pageSize: number
  search?: string
  status?: "all" | "active" | "suspended"
  adminRole?: "all" | AdminRole
}

export async function getAdminUsers(filters: UserListFilters): Promise<UserListResult> {
  const where: Prisma.UserWhereInput = {}

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
      { company: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  if (filters.status === "active") {
    where.isActive = true
  }

  if (filters.status === "suspended") {
    where.isActive = false
  }

  if (filters.adminRole && filters.adminRole !== "all") {
    where.adminRole = filters.adminRole
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
      include: {
        business: {
          select: {
            name: true,
            subscriptionARS: {
              select: {
                plan: {
                  select: {
                    name: true,
                  },
                },
                status: true,
              },
            },
          },
        },
      },
    }),
  ])

  return {
    items: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      company: user.company || user.business?.name || "-",
      role: user.role,
      adminRole: user.adminRole,
      plan: user.business?.subscriptionARS?.plan.name || "Sin plan",
      status: user.isActive ? "active" : "suspended",
      createdAt: user.createdAt,
      lastLogin: user.lastLoginAt,
    })),
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
  }
}

export async function getAdminPlans() {
  return prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { priceMonthly: "asc" },
    select: {
      id: true,
      name: true,
      priceMonthly: true,
      priceYearly: true,
    },
  })
}

export async function setUserSuspended(params: {
  userId: string
  suspended: boolean
  actorUserId?: string | null
}): Promise<void> {
  await prisma.user.update({
    where: { id: params.userId },
    data: {
      isActive: !params.suspended,
    },
  })

  await logAdminAction({
    actorUserId: params.actorUserId,
    event: "admin.user.suspend_toggle",
    description: params.suspended ? "Usuario suspendido" : "Usuario reactivado",
    metadata: {
      userId: params.userId,
      suspended: params.suspended,
    },
  })
}

export async function updateUserAdminRole(params: {
  userId: string
  adminRole: AdminRole
  actorUserId?: string | null
}): Promise<void> {
  await prisma.user.update({
    where: { id: params.userId },
    data: {
      adminRole: params.adminRole,
    },
  })

  await logAdminAction({
    actorUserId: params.actorUserId,
    event: "admin.user.change_role",
    description: "Cambio de rol administrativo",
    metadata: {
      userId: params.userId,
      adminRole: params.adminRole,
    },
  })
}

export async function changeUserPlan(params: {
  userId: string
  planId: string
  actorUserId?: string | null
}): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      businessId: true,
      email: true,
    },
  })

  if (!user?.businessId) {
    throw new Error("El usuario no tiene business asociado")
  }

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

  const current = await prisma.subscriptionARS.findUnique({
    where: { businessId: user.businessId },
    select: {
      id: true,
      billingCycle: true,
      status: true,
    },
  })

  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setMonth(periodEnd.getMonth() + 1)

  if (current) {
    await prisma.subscriptionARS.update({
      where: { id: current.id },
      data: {
        planId: plan.id,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        totalMonthly: plan.priceMonthly,
      },
    })
  } else {
    await prisma.subscriptionARS.create({
      data: {
        businessId: user.businessId,
        planId: plan.id,
        status: "active",
        billingCycle: "monthly",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        totalMonthly: plan.priceMonthly,
      },
    })
  }

  await logAdminAction({
    actorUserId: params.actorUserId,
    event: "admin.user.change_plan",
    description: "Cambio de plan de usuario",
    metadata: {
      userId: params.userId,
      planId: plan.id,
      planName: plan.name,
    },
  })
}

export async function resetUserPassword(params: {
  userId: string
  newPassword: string
  actorUserId?: string | null
}): Promise<void> {
  const hashed = await hash(params.newPassword, 12)

  await prisma.user.update({
    where: { id: params.userId },
    data: {
      passwordHash: hashed,
    },
  })

  await logAdminAction({
    actorUserId: params.actorUserId,
    event: "admin.user.reset_password",
    description: "Reseteo de password desde panel admin",
    metadata: {
      userId: params.userId,
    },
    level: "warning",
  })
}
