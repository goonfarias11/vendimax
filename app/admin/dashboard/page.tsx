import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { DashboardCharts } from "@/components/admin/dashboard-charts"
import { MetricCard } from "@/components/admin/metric-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDashboardMetrics } from "@/services/admin/dashboard.service"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const dashboard = await getDashboardMetrics()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Dashboard Ejecutivo</h2>
        <p className="text-sm text-slate-600">
          Vista consolidada de usuarios, ingresos, conversion y soporte.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard title="Total users" value={dashboard.totals.totalUsers.toLocaleString("es-AR")} />
        <MetricCard title="Active users" value={dashboard.totals.activeUsers.toLocaleString("es-AR")} />
        <MetricCard title="Paying users" value={dashboard.totals.payingUsers.toLocaleString("es-AR")} />
        <MetricCard
          title="Monthly recurring revenue"
          value={`$${dashboard.totals.monthlyRecurringRevenue.toLocaleString("es-AR")}`}
        />
        <MetricCard title="New users today" value={dashboard.totals.newUsersToday.toLocaleString("es-AR")} />
        <MetricCard
          title="Open support tickets"
          value={dashboard.totals.openSupportTickets.toLocaleString("es-AR")}
        />
      </div>

      <DashboardCharts
        userGrowth={dashboard.charts.userGrowth}
        monthlyRevenue={dashboard.charts.monthlyRevenue}
        conversion={dashboard.charts.freeToPaidConversion}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Atajos operativos</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          <Link
            href="/admin/users"
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 hover:bg-slate-100"
          >
            Gestionar usuarios
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/admin/support"
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 hover:bg-slate-100"
          >
            Revisar tickets de soporte
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/admin/payments"
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 hover:bg-slate-100"
          >
            Validar pagos y exportar CSV
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/admin/settings"
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 hover:bg-slate-100"
          >
            Configuracion global
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
