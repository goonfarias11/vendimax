"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { DashboardCharts } from "@/components/admin/dashboard-charts"
import { MetricCard } from "@/components/admin/metric-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DashboardMetrics } from "@/services/admin/dashboard.service"

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/dashboard-metrics")
      .then(r => r.json())
      .then(data => setDashboard(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Panel de Administración</h1>
        <p className="text-slate-600">Métricas generales de VendiMax</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard title="Usuarios totales" value={String(dashboard.totals.totalUsers)} />
        <MetricCard title="Usuarios activos" value={String(dashboard.totals.activeUsers)} />
        <MetricCard title="Usuarios pagos" value={String(dashboard.totals.payingUsers)} />
        <MetricCard title="MRR" value={"$" + dashboard.totals.monthlyRecurringRevenue.toLocaleString("es-AR")} />
        <MetricCard title="Nuevos hoy" value={String(dashboard.totals.newUsersToday)} />
        <MetricCard title="Tickets abiertos" value={String(dashboard.totals.openSupportTickets)} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gráficos</CardTitle>
          <Link href="/admin/analytics" className="flex items-center gap-1 text-sm text-purple-600 hover:underline">
            Ver analytics <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          <DashboardCharts userGrowth={dashboard.charts.userGrowth} monthlyRevenue={dashboard.charts.monthlyRevenue} conversion={dashboard.charts.freeToPaidConversion} />
        </CardContent>
      </Card>
    </div>
  )
}
