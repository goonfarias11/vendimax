"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ChartPoint = {
  label: string
  value: number
}

type ConversionPoint = {
  label: string
  free: number
  paid: number
  conversionRate: number
}

type DashboardChartsProps = {
  userGrowth: ChartPoint[]
  monthlyRevenue: ChartPoint[]
  conversion: ConversionPoint[]
}

export function DashboardCharts({ userGrowth, monthlyRevenue, conversion }: DashboardChartsProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card className="xl:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Crecimiento de usuarios</CardTitle>
        </CardHeader>
        <CardContent className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#0f766e" fill="#14b8a6" fillOpacity={0.25} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="xl:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Ingresos mensuales</CardTitle>
        </CardHeader>
        <CardContent className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [`$${Number(value).toLocaleString("es-AR")}`, "Ingresos"]} />
              <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="xl:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Conversion free a paid</CardTitle>
        </CardHeader>
        <CardContent className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={conversion}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="free" name="Free" stroke="#f97316" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="paid" name="Paid" stroke="#16a34a" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="conversionRate" name="Conversion %" stroke="#7c3aed" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
