import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getDashboardMetrics } from "@/services/admin/dashboard.service"

export const runtime = "nodejs"

export async function GET() {
  const session = await auth()
  const adminRole = (session?.user as any)?.adminRole

  if (!session?.user || (adminRole !== "super_admin" && adminRole !== "admin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const metrics = await getDashboardMetrics()
  return NextResponse.json(metrics)
}
