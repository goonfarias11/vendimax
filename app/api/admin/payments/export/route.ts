import { NextRequest, NextResponse } from "next/server"
import { requireAdminApiSession } from "@/lib/admin/api-auth"
import { exportAdminPaymentsCsv } from "@/services/admin/payments.service"

export async function GET(request: NextRequest) {
  const authResult = await requireAdminApiSession()
  if (!authResult.authorized) {
    return authResult.response
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") ?? undefined
  const method = searchParams.get("method") ?? undefined
  const from = searchParams.get("from") ?? undefined
  const to = searchParams.get("to") ?? undefined

  const csv = await exportAdminPaymentsCsv({ status, method, from, to })

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vendimax-payments-${Date.now()}.csv"`,
    },
  })
}
