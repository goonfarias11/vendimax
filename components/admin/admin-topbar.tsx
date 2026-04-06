"use client"

import { Bell, LogOut, ShieldCheck } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"

type AdminTopbarProps = {
  notifications: number
}

export function AdminTopbar({ notifications }: AdminTopbarProps) {
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Internal Control</p>
          <h1 className="text-lg font-semibold text-slate-900">Administracion SaaS</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative rounded-full border border-slate-200 p-2 text-slate-600">
            <Bell className="h-4 w-4" />
            {notifications > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">
                {notifications > 99 ? "99+" : notifications}
              </span>
            )}
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-900">{session?.user?.name || "Admin"}</p>
            <p className="text-xs text-slate-500">{session?.user?.email}</p>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 md:flex">
            <ShieldCheck className="h-3.5 w-3.5" />
            Rol elevado
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
