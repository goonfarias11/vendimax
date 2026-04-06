import { DashboardCharts } from "@/components/admin/dashboard-charts"
import { MetricCard } from "@/components/admin/metric-card"
import { getAnalyticsTrends, getSaasAnalytics } from "@/services/admin/analytics.service"

export const dynamic = "force-dynamic"

export default async function AdminAnalyticsPage() {
  const [analytics, trends] = await Promise.all([getSaasAnalytics(), getAnalyticsTrends()])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Analytics</h2>
        <p className="text-sm text-slate-600">KPIs SaaS para rentabilidad, retencion y crecimiento.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard title="MRR" value={`$${analytics.mrr.toLocaleString("es-AR")}`} />
        <MetricCard title="Churn rate" value={`${analytics.churnRate}%`} />
        <MetricCard title="Lifetime value" value={`$${analytics.lifetimeValue.toLocaleString("es-AR")}`} />
        <MetricCard title="CAC" value={`$${analytics.cac.toLocaleString("es-AR")}`} hint="Estimado con ADMIN_MARKETING_SPEND_MONTHLY" />
        <MetricCard title="Conversion rate" value={`${analytics.conversionRate}%`} />
        <MetricCard title="Active subscriptions" value={analytics.activeSubscriptions.toLocaleString("es-AR")} />
      </div>

      <DashboardCharts
        userGrowth={trends.userGrowth}
        monthlyRevenue={trends.revenue}
        conversion={trends.conversion}
      />
    </div>
  )
}
