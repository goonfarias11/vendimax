import { SettingsForm } from "@/components/admin/settings-form"
import { getAdminSettings } from "@/services/admin/settings.service"

export const dynamic = "force-dynamic"

export default async function AdminSettingsPage() {
  const settings = await getAdminSettings()

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-600">
          Configura nombre de plataforma, precios de planes, feature flags y sistema de emails.
        </p>
      </div>

      <SettingsForm
        platformName={settings.platformName}
        featureFlags={settings.featureFlags}
        emailSystem={settings.emailSystem}
        plans={settings.plans}
      />
    </div>
  )
}
