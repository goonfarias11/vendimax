import { Card, CardContent } from "@/components/ui/card"

type MetricCardProps = {
  title: string
  value: string
  hint?: string
}

export function MetricCard({ title, value, hint }: MetricCardProps) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="space-y-1 p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{title}</p>
        <p className="text-2xl font-semibold text-slate-950">{value}</p>
        {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}
