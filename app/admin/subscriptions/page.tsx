import { AdminPagination } from "@/components/admin/admin-pagination"
import { SubscriptionsTable } from "@/components/admin/subscriptions-table"
import { getAdminPlans } from "@/services/admin/users.service"
import { getAdminSubscriptions } from "@/services/admin/subscriptions.service"

export const dynamic = "force-dynamic"

type SubscriptionsPageProps = {
  searchParams: Promise<{
    page?: string
    q?: string
    status?: string
  }>
}

export default async function AdminSubscriptionsPage({ searchParams }: SubscriptionsPageProps) {
  const params = await searchParams
  const page = Number(params.page ?? "1") || 1
  const pageSize = 12

  const [result, plans] = await Promise.all([
    getAdminSubscriptions({
      page,
      pageSize,
      search: params.q,
      status:
        params.status === "active" ||
        params.status === "trial" ||
        params.status === "past_due" ||
        params.status === "canceled" ||
        params.status === "expired"
          ? params.status
          : "all",
    }),
    getAdminPlans(),
  ])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Subscriptions</h2>
        <p className="text-sm text-slate-600">Gestion de plan, renovacion y estado de suscripcion.</p>
      </div>

      <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Buscar por empresa, email o plan"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select name="status" defaultValue={params.status ?? "all"} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="all">Estado: todos</option>
          <option value="active">active</option>
          <option value="trial">trial</option>
          <option value="past_due">past_due</option>
          <option value="canceled">canceled</option>
          <option value="expired">expired</option>
        </select>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Aplicar filtros
        </button>
      </form>

      <SubscriptionsTable
        rows={result.items.map((item) => ({
          ...item,
          startDate: item.startDate.toISOString(),
          renewalDate: item.renewalDate.toISOString(),
        }))}
        plans={plans.map((plan) => ({
          id: plan.id,
          name: plan.name,
          priceMonthly: Number(plan.priceMonthly),
        }))}
      />

      <AdminPagination
        basePath="/admin/subscriptions"
        page={result.page}
        totalPages={result.totalPages}
        searchParams={{
          q: params.q,
          status: params.status,
        }}
      />
    </div>
  )
}
