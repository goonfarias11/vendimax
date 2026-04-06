"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
  BarChart3,
  CreditCard,
  LayoutGrid,
  Logs,
  Settings,
  Shield,
  Users,
  MessageSquare,
} from "lucide-react"
import { ADMIN_NAV_ITEMS } from "@/lib/admin/navigation"
import { cn } from "@/lib/utils"

const ICONS = {
  layout: LayoutGrid,
  users: Users,
  subscription: Shield,
  payments: CreditCard,
  support: MessageSquare,
  analytics: BarChart3,
  logs: Logs,
  settings: Settings,
}

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-slate-950 text-slate-100 lg:block">
      <div className="border-b border-slate-800 px-6 py-6">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">VendiMax</p>
        <h2 className="mt-2 text-xl font-semibold">Admin Panel</h2>
      </div>

      <nav className="space-y-1 p-4">
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon]
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-cyan-500/20 text-cyan-200"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto border-t border-slate-800 p-4">
        <div className="rounded-lg bg-slate-900 p-3 text-xs text-slate-300">
          <div className="mb-2 flex items-center gap-2 text-slate-200">
            <Activity className="h-4 w-4" />
            Estado operativo
          </div>
          Monitoreo de usuarios, pagos y soporte en tiempo real.
        </div>
      </div>
    </aside>
  )
}
