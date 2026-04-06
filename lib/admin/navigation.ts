export type AdminNavItem = {
  href:
    | "/admin/dashboard"
    | "/admin/users"
    | "/admin/subscriptions"
    | "/admin/payments"
    | "/admin/support"
    | "/admin/analytics"
    | "/admin/system-logs"
    | "/admin/settings"
  label: string
  icon: "layout" | "users" | "subscription" | "payments" | "support" | "analytics" | "logs" | "settings"
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "layout" },
  { href: "/admin/users", label: "Usuarios", icon: "users" },
  { href: "/admin/subscriptions", label: "Suscripciones", icon: "subscription" },
  { href: "/admin/payments", label: "Pagos", icon: "payments" },
  { href: "/admin/support", label: "Soporte", icon: "support" },
  { href: "/admin/analytics", label: "Analitica", icon: "analytics" },
  { href: "/admin/system-logs", label: "System Logs", icon: "logs" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
]
