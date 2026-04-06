import { type Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export type SystemLogsFilters = {
  page: number
  pageSize: number
  level?: "all" | "info" | "warning" | "error" | "critical"
  category?: string
  search?: string
}

export type SystemLogItem = {
  id: string
  level: string
  category: string
  event: string
  description: string
  actor: string
  createdAt: Date
}

export type SystemLogResult = {
  items: SystemLogItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getSystemLogs(filters: SystemLogsFilters): Promise<SystemLogResult> {
  const where: Prisma.SystemLogWhereInput = {}

  if (filters.level && filters.level !== "all") {
    where.level = filters.level
  }

  if (filters.category && filters.category !== "all") {
    where.category = filters.category
  }

  if (filters.search) {
    where.OR = [
      { event: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { actor: { is: { email: { contains: filters.search, mode: "insensitive" } } } },
    ]
  }

  try {
    const [total, rows] = await Promise.all([
      prisma.systemLog.count({ where }),
      prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
        include: {
          actor: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
    ])

    return {
      items: rows.map((row) => ({
        id: row.id,
        level: row.level,
        category: row.category,
        event: row.event,
        description: row.description,
        actor: row.actor?.name || row.actor?.email || "system",
        createdAt: row.createdAt,
      })),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
    }
  } catch (error) {
    const message = (error as Error)?.message ?? String(error)
    console.warn("No se pudo consultar la tabla system_logs:", message)

    return {
      items: [],
      total: 0,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: 1,
    }
  }
}
