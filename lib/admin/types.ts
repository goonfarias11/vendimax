export type AdminTablePagination = {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type AdminUserRow = {
  id: string
  name: string
  email: string
  company: string
  role: string
  adminRole: "user" | "admin" | "super_admin"
  plan: string
  status: "active" | "suspended"
  createdAt: string
  lastLogin: string | null
}

export type AdminPlanRow = {
  id: string
  name: string
  priceMonthly: number
}

export type AdminSubscriptionRow = {
  id: string
  user: string
  businessEmail: string
  plan: string
  planId: string
  price: number
  startDate: string
  renewalDate: string
  paymentMethod: string
  status: string
}

export type AdminPaymentRow = {
  id: string
  user: string
  amount: number
  currency: string
  method: string
  status: string
  date: string
}

export type AdminSupportRow = {
  id: string
  subject: string
  requester: string
  status: "open" | "pending" | "solved" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  messagesCount: number
  lastMessage: string
  createdAt: string
  updatedAt: string
}

export type AdminSystemLogRow = {
  id: string
  level: string
  category: string
  event: string
  description: string
  actor: string
  createdAt: string
}
