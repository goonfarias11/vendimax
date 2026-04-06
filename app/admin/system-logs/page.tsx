import { AdminPagination } from "@/components/admin/admin-pagination"
import { getSystemLogs } from "@/services/admin/system-logs.service"

export const dynamic = "force-dynamic"

type SystemLogsPageProps = {
  searchParams: Promise<{
    page?: string
    q?: string
    level?: string
    category?: string
  }>
}

export default async function AdminSystemLogsPage({ searchParams }: SystemLogsPageProps) {
  const params = await searchParams
  const page = Number(params.page ?? "1") || 1
  const pageSize = 20

  const result = await getSystemLogs({
    page,
    pageSize,
    search: params.q,
    level:
      params.level === "info" ||
      params.level === "warning" ||
      params.level === "error" ||
      params.level === "critical"
        ? params.level
        : "all",
    category: params.category,
  })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">System logs</h2>
        <p className="text-sm text-slate-600">Eventos de login, pagos, errores, acciones admin y fallas de API.</p>
      </div>

      <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-4">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Buscar por evento, descripcion o actor"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select name="level" defaultValue={params.level ?? "all"} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="all">Nivel: todos</option>
          <option value="info">info</option>
          <option value="warning">warning</option>
          <option value="error">error</option>
          <option value="critical">critical</option>
        </select>
        <input
          name="category"
          defaultValue={params.category}
          placeholder="Categoria (admin, payments, auth...)"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Filtrar
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-[1000px] w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((log) => (
              <tr key={log.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                    {log.level}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">{log.category}</td>
                <td className="px-4 py-3 text-slate-900">{log.event}</td>
                <td className="px-4 py-3 text-slate-700">{log.description}</td>
                <td className="px-4 py-3 text-slate-700">{log.actor}</td>
                <td className="px-4 py-3 text-slate-700">{log.createdAt.toLocaleString("es-AR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminPagination
        basePath="/admin/system-logs"
        page={result.page}
        totalPages={result.totalPages}
        searchParams={{
          q: params.q,
          level: params.level,
          category: params.category,
        }}
      />
    </div>
  )
}
