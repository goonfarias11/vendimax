import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  const token = await getToken({ req, secret })
  const adminRole = token?.adminRole as string | undefined

  if (!token || adminRole !== "super_admin") {
    return NextResponse.json({ error: "No autorizado", adminRole, hasToken: !!token }, { status: 401 })
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN!
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const planes = [
    { reason: "VendiMax Emprendedor", amount: 8500, slug: "emprendedor" },
    { reason: "VendiMax Pyme", amount: 14000, slug: "pyme" },
    { reason: "VendiMax Full", amount: 22000, slug: "full" },
  ]

  const results = []

  for (const plan of planes) {
    try {
      const res = await fetch("https://api.mercadopago.com/preapproval_plan", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: plan.reason,
          auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            transaction_amount: plan.amount,
            currency_id: "ARS",
          },
          payment_methods_allowed: {
            payment_types: [{ id: "credit_card" }, { id: "debit_card" }],
          },
          back_url: `${appUrl}/dashboard/suscripcion?status=success`,
          status: "active",
        }),
      })

      const data = await res.json()
      results.push({ slug: plan.slug, id: data.id, status: res.status, error: data.message })
    } catch (error) {
      results.push({ slug: plan.slug, error: String(error) })
    }
  }

  return NextResponse.json({ results })
}
