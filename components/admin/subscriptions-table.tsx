"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdminPlanRow, AdminSubscriptionRow } from "@/lib/admin/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

type SubscriptionsTableProps = {
  rows: AdminSubscriptionRow[]
  plans: AdminPlanRow[]
}

export function SubscriptionsTable({ rows, plans }: SubscriptionsTableProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [planDraft, setPlanDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(rows.map((row) => [row.id, row.planId]))
  )
  const [trialTarget, setTrialTarget] = useState<string | null>(null)
  const [trialDays, setTrialDays] = useState("7")

  async function patchSubscription(
    subscriptionId: string,
    payload: Record<string, unknown>,
    successMessage: string
  ) {
    try {
      setLoadingId(subscriptionId)
      const response = await fetch(`/api/admin/subscriptions/${subscriptionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Error inesperado" }))
        throw new Error(data.error || "No se pudo actualizar la suscripcion")
      }

      toast.success(successMessage)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error inesperado")
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Start</th>
              <th className="px-4 py-3">Renewal</th>
              <th className="px-4 py-3">Payment method</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100 align-top">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{row.user}</p>
                  <p className="text-xs text-slate-500">{row.businessEmail}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="mb-1 text-slate-700">{row.plan}</p>
                  <select
                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                    value={planDraft[row.id]}
                    onChange={(event) =>
                      setPlanDraft((prev) => ({ ...prev, [row.id]: event.target.value }))
                    }
                  >
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} (${plan.priceMonthly.toLocaleString("es-AR")})
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">${row.price.toLocaleString("es-AR")}</td>
                <td className="px-4 py-3">{new Date(row.startDate).toLocaleDateString("es-AR")}</td>
                <td className="px-4 py-3">{new Date(row.renewalDate).toLocaleDateString("es-AR")}</td>
                <td className="px-4 py-3">{row.paymentMethod}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loadingId === row.id}
                      onClick={() =>
                        patchSubscription(
                          row.id,
                          { action: "change_plan", planId: planDraft[row.id] },
                          "Plan actualizado"
                        )
                      }
                    >
                      Cambiar plan
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={loadingId === row.id || row.status === "canceled"}
                      onClick={() =>
                        patchSubscription(row.id, { action: "cancel" }, "Suscripcion cancelada")
                      }
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={loadingId === row.id}
                      onClick={() => {
                        setTrialTarget(row.id)
                        setTrialDays("7")
                      }}
                    >
                      Extender trial
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={Boolean(trialTarget)} onOpenChange={(open) => !open && setTrialTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extender periodo de trial</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-slate-600">Define cuantos dias adicionales se agregan al trial.</p>
            <Input
              type="number"
              min={1}
              max={60}
              value={trialDays}
              onChange={(event) => setTrialDays(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrialTarget(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!trialTarget) return
                patchSubscription(
                  trialTarget,
                  { action: "extend_trial", days: Number(trialDays) || 7 },
                  "Trial extendido"
                ).finally(() => setTrialTarget(null))
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
