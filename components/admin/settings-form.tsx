"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

type SettingsPlan = {
  id: string
  name: string
  priceMonthly: number
  priceYearly: number
  isActive: boolean
}

type SettingsFormProps = {
  platformName: string
  featureFlags: Record<string, unknown>
  emailSystem: Record<string, unknown>
  plans: SettingsPlan[]
}

export function SettingsForm({ platformName, featureFlags, emailSystem, plans }: SettingsFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [platformNameState, setPlatformNameState] = useState(platformName)
  const [flags, setFlags] = useState({
    advancedReports: Boolean(featureFlags.advancedReports),
    supportChat: Boolean(featureFlags.supportChat),
    experimentalBilling: Boolean(featureFlags.experimentalBilling),
  })
  const [emailConfig, setEmailConfig] = useState({
    provider: String(emailSystem.provider ?? "resend"),
    from: String(emailSystem.from ?? "no-reply@vendimax.com"),
  })
  const [planState, setPlanState] = useState(plans)

  async function saveSettings() {
    try {
      setSaving(true)
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platformName: platformNameState,
          featureFlags: flags,
          emailSystem: emailConfig,
          plans: planState,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Error inesperado" }))
        throw new Error(data.error || "No se pudieron guardar los cambios")
      }

      toast.success("Configuraciones guardadas")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error inesperado")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Plataforma</h2>
        <p className="mt-1 text-sm text-slate-500">Nombre de la plataforma y sistema de emails.</p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nombre de la plataforma</label>
            <Input value={platformNameState} onChange={(event) => setPlatformNameState(event.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Email provider</label>
            <Input
              value={emailConfig.provider}
              onChange={(event) =>
                setEmailConfig((prev) => ({ ...prev, provider: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Email from</label>
            <Input
              value={emailConfig.from}
              onChange={(event) => setEmailConfig((prev) => ({ ...prev, from: event.target.value }))}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Feature flags</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm">
            Advanced reports
            <Switch
              checked={flags.advancedReports}
              onCheckedChange={(checked) => setFlags((prev) => ({ ...prev, advancedReports: checked }))}
            />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm">
            Support chat
            <Switch
              checked={flags.supportChat}
              onCheckedChange={(checked) => setFlags((prev) => ({ ...prev, supportChat: checked }))}
            />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm">
            Experimental billing
            <Switch
              checked={flags.experimentalBilling}
              onCheckedChange={(checked) =>
                setFlags((prev) => ({ ...prev, experimentalBilling: checked }))
              }
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Precios de planes</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[760px] w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-600">
              <tr>
                <th className="px-3 py-2">Plan</th>
                <th className="px-3 py-2">Mensual</th>
                <th className="px-3 py-2">Anual</th>
                <th className="px-3 py-2">Activo</th>
              </tr>
            </thead>
            <tbody>
              {planState.map((plan) => (
                <tr key={plan.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium">{plan.name}</td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      value={plan.priceMonthly}
                      onChange={(event) => {
                        const value = Number(event.target.value)
                        setPlanState((prev) =>
                          prev.map((item) =>
                            item.id === plan.id ? { ...item, priceMonthly: Number.isFinite(value) ? value : 0 } : item
                          )
                        )
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      value={plan.priceYearly}
                      onChange={(event) => {
                        const value = Number(event.target.value)
                        setPlanState((prev) =>
                          prev.map((item) =>
                            item.id === plan.id ? { ...item, priceYearly: Number.isFinite(value) ? value : 0 } : item
                          )
                        )
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Switch
                      checked={plan.isActive}
                      onCheckedChange={(checked) =>
                        setPlanState((prev) =>
                          prev.map((item) => (item.id === plan.id ? { ...item, isActive: checked } : item))
                        )
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? "Guardando..." : "Guardar configuraciones"}
        </Button>
      </div>
    </div>
  )
}
