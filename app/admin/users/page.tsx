import { AdminPagination } from "@/components/admin/admin-pagination"
import { UsersTable } from "@/components/admin/users-table"
import { getAdminPlans, getAdminUsers } from "@/services/admin/users.service"

export const dynamic = "force-dynamic"

type UserPageProps = {
  searchParams: Promise<{
    page?: string
    q?: string
    status?: string
    adminRole?: string
  }>
}

export default async function AdminUsersPage({ searchParams }: UserPageProps) {
  const params = await searchParams
  const page = Number(params.page ?? "1") || 1
  const pageSize = 12

  const [result, plans] = await Promise.all([
    getAdminUsers({
      page,
      pageSize,
      search: params.q,
      status: params.status === "active" || params.status === "suspended" ? params.status : "all",
      adminRole:
        params.adminRole === "user" || params.adminRole === "admin" || params.adminRole === "super_admin"
          ? params.adminRole
          : "all",
    }),
    getAdminPlans(),
  ])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Users management</h2>
        <p className="text-sm text-slate-600">Administra usuarios, roles, planes y accesos impersonados.</p>
      </div>

      <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-4">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Buscar por nombre o email"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select name="status" defaultValue={params.status ?? "all"} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="all">Estado: todos</option>
          <option value="active">Activos</option>
          <option value="suspended">Suspendidos</option>
        </select>
        <select
          name="adminRole"
          defaultValue={params.adminRole ?? "all"}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="all">Rol admin: todos</option>
          <option value="user">user</option>
          <option value="admin">admin</option>
          <option value="super_admin">super_admin</option>
        </select>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Aplicar filtros
        </button>
      </form>

      <UsersTable
        users={result.items.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
          lastLogin: item.lastLogin ? item.lastLogin.toISOString() : null,
        }))}
        plans={plans.map((plan) => ({
          id: plan.id,
          name: plan.name,
          priceMonthly: Number(plan.priceMonthly),
        }))}
      />

      <AdminPagination
        basePath="/admin/users"
        page={result.page}
        totalPages={result.totalPages}
        searchParams={{
          q: params.q,
          status: params.status,
          adminRole: params.adminRole,
        }}
      />
    </div>
  )
}
