import { AdminPagination } from "@/components/admin/admin-pagination"
import { SupportTable } from "@/components/admin/support-table"
import { getSupportTickets } from "@/services/admin/support.service"

export const dynamic = "force-dynamic"

type SupportPageProps = {
  searchParams: Promise<{
    page?: string
    q?: string
    status?: string
    priority?: string
  }>
}

export default async function AdminSupportPage({ searchParams }: SupportPageProps) {
  const params = await searchParams
  const page = Number(params.page ?? "1") || 1
  const pageSize = 12

  const result = await getSupportTickets({
    page,
    pageSize,
    search: params.q,
    status:
      params.status === "open" ||
      params.status === "pending" ||
      params.status === "solved" ||
      params.status === "closed"
        ? params.status
        : "all",
    priority:
      params.priority === "low" ||
      params.priority === "medium" ||
      params.priority === "high" ||
      params.priority === "urgent"
        ? params.priority
        : "all",
  })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Support center</h2>
        <p className="text-sm text-slate-600">Gestion de tickets, estados, prioridad y mensajes internos.</p>
      </div>

      <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-4">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Buscar por asunto o cliente"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select name="status" defaultValue={params.status ?? "all"} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="all">Estado: todos</option>
          <option value="open">open</option>
          <option value="pending">pending</option>
          <option value="solved">solved</option>
          <option value="closed">closed</option>
        </select>
        <select name="priority" defaultValue={params.priority ?? "all"} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="all">Prioridad: todas</option>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
          <option value="urgent">urgent</option>
        </select>
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Filtrar
        </button>
      </form>

      <SupportTable
        tickets={result.items.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        }))}
      />

      <AdminPagination
        basePath="/admin/support"
        page={result.page}
        totalPages={result.totalPages}
        searchParams={{
          q: params.q,
          status: params.status,
          priority: params.priority,
        }}
      />
    </div>
  )
}
