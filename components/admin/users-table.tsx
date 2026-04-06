"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminPlanRow, AdminUserRow } from "@/lib/admin/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

type UsersTableProps = {
  users: AdminUserRow[]
  plans: AdminPlanRow[]
}

async function apiAction(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Error inesperado" }))
    throw new Error(payload.error || "No se pudo completar la accion")
  }
}

export function UsersTable({ users, plans }: UsersTableProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null)
  const [newPassword, setNewPassword] = useState("")

  const [roleDraft, setRoleDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(users.map((user) => [user.id, user.adminRole]))
  )

  const [planDraft, setPlanDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(users.map((user) => {
      const found = plans.find((plan) => plan.name === user.plan)
      return [user.id, found?.id ?? ""]
    }))
  )

  const planOptions = useMemo(() => plans, [plans])

  async function runAction(userId: string, callback: () => Promise<void>, successMessage: string) {
    try {
      setLoadingId(userId)
      await callback()
      toast.success(successMessage)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error inesperado")
    } finally {
      setLoadingId(null)
    }
  }

  async function handleImpersonate(userId: string) {
    try {
      setLoadingId(userId)
      const response = await fetch("/api/users/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "No se pudo impersonar" }))
        throw new Error(payload.error || "No se pudo impersonar")
      }

      const data = await response.json()
      sessionStorage.setItem("impersonation", JSON.stringify(data))
      window.location.href = "/dashboard"
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error en impersonation")
      setLoadingId(null)
    }
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-[1180px] w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Last login</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-slate-100 align-top">
                <td className="px-4 py-3 text-xs text-slate-500">{user.id.slice(0, 8)}...</td>
                <td className="px-4 py-3 font-medium text-slate-900">{user.name}</td>
                <td className="px-4 py-3 text-slate-700">{user.email}</td>
                <td className="px-4 py-3 text-slate-700">{user.company}</td>
                <td className="px-4 py-3">
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">{user.role}</p>
                    <select
                      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
                      value={roleDraft[user.id] ?? user.adminRole}
                      onChange={(event) =>
                        setRoleDraft((prev) => ({ ...prev, [user.id]: event.target.value }))
                      }
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                      <option value="super_admin">super_admin</option>
                    </select>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loadingId === user.id}
                      onClick={() =>
                        runAction(
                          user.id,
                          () =>
                            apiAction(`/api/admin/users/${user.id}/role`, {
                              adminRole: roleDraft[user.id] ?? user.adminRole,
                            }),
                          "Rol actualizado"
                        )
                      }
                    >
                      Cambiar rol
                    </Button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">{user.plan}</p>
                    <select
                      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
                      value={planDraft[user.id] ?? ""}
                      onChange={(event) =>
                        setPlanDraft((prev) => ({ ...prev, [user.id]: event.target.value }))
                      }
                    >
                      <option value="">Seleccionar plan</option>
                      {planOptions.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} (${plan.priceMonthly.toLocaleString("es-AR")})
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loadingId === user.id || !planDraft[user.id]}
                      onClick={() =>
                        runAction(
                          user.id,
                          () =>
                            apiAction(`/api/admin/users/${user.id}/plan`, {
                              planId: planDraft[user.id],
                            }),
                          "Plan actualizado"
                        )
                      }
                    >
                      Cambiar plan
                    </Button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      user.status === "active"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">{new Date(user.createdAt).toLocaleDateString("es-AR")}</td>
                <td className="px-4 py-3 text-slate-700">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleString("es-AR") : "-"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant={user.status === "active" ? "destructive" : "outline"}
                      disabled={loadingId === user.id}
                      onClick={() =>
                        runAction(
                          user.id,
                          () =>
                            apiAction(`/api/admin/users/${user.id}/suspend`, {
                              suspended: user.status === "active",
                            }),
                          user.status === "active" ? "Usuario suspendido" : "Usuario reactivado"
                        )
                      }
                    >
                      {user.status === "active" ? "Suspender" : "Reactivar"}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loadingId === user.id}
                      onClick={() => setResetTarget({ id: user.id, name: user.name })}
                    >
                      Reset password
                    </Button>

                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={loadingId === user.id}
                      onClick={() => handleImpersonate(user.id)}
                    >
                      Impersonate
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={Boolean(resetTarget)} onOpenChange={(open) => !open && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetear password</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Defini una clave temporal para {resetTarget?.name}.
            </p>
            <Input
              type="password"
              placeholder="Nueva clave temporal"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)}>
              Cancelar
            </Button>
            <Button
              disabled={!resetTarget || newPassword.length < 8 || loadingId === resetTarget?.id}
              onClick={() => {
                if (!resetTarget) return
                runAction(
                  resetTarget.id,
                  () =>
                    apiAction(`/api/admin/users/${resetTarget.id}/reset-password`, {
                      newPassword,
                    }),
                  "Password reseteada"
                ).finally(() => {
                  setResetTarget(null)
                  setNewPassword("")
                })
              }}
            >
              Confirmar reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
