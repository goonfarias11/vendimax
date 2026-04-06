import Link from "next/link"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { getAdminPayments } from "@/services/admin/payments.service"

export const dynamic = "force-dynamic"

type PaymentsPageProps = {
  searchParams: Promise<{
    page?: string
    status?: string
    method?: string
    from?: string
    to?: string
  }>
}

export default async function AdminPaymentsPage({ searchParams }: PaymentsPageProps) {
  const params = await searchParams
  const page = Number(params.page ?? "1") || 1
  const pageSize = 15

  const result = await getAdminPayments({
    page,
    pageSize,
    status: params.status,
    method: params.method,
    from: params.from,
    to: params.to,
  })

  const csvParams = new URLSearchParams()
  if (params.status) csvParams.set("status", params.status)
  if (params.method) csvParams.set("method", params.method)
  if (params.from) csvParams.set("from", params.from)
  if (params.to) csvParams.set("to", params.to)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Payments</h2>
          <p className="text-sm text-slate-600">Historial de pagos con filtros por fecha y export CSV.</p>
        </div>
        <Link
          href={`/api/admin/payments/export?${csvParams.toString()}`}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Export CSV
        </Link>
      </div>

      <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-5">
        <select name="status" defaultValue={params.status ?? "all"} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="all">Status: todos</option>
          <option value="pending">pending</option>
          <option value="approved">approved</option>
          <option value="paid">paid</option>
          <option value="rejected">rejected</option>
        </select>
        <select name="method" defaultValue={params.method ?? "all"} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="all">Metodo: todos</option>
          <option value="card">card</option>
          <option value="transfer">transfer</option>
          <option value="cash">cash</option>
        </select>
        <input type="date" name="from" defaultValue={params.from} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <input type="date" name="to" defaultValue={params.to} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Filtrar
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Currency</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-4 py-3 text-slate-800">{item.user}</td>
                <td className="px-4 py-3 font-medium text-slate-900">${item.amount.toLocaleString("es-AR")}</td>
                <td className="px-4 py-3 text-slate-700">{item.currency}</td>
                <td className="px-4 py-3 text-slate-700">{item.method}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">{item.date.toLocaleString("es-AR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminPagination
        basePath="/admin/payments"
        page={result.page}
        totalPages={result.totalPages}
        searchParams={{
          status: params.status,
          method: params.method,
          from: params.from,
          to: params.to,
        }}
      />
    </div>
  )
}
