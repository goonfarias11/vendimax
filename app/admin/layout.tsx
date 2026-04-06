import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { hasAdminPanelAccess } from "@/lib/admin/access"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminTopbar } from "@/components/admin/admin-topbar"
import { getAdminNotificationCount } from "@/services/admin/dashboard.service"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login?next=/admin")
  }

  if (!hasAdminPanelAccess(session.user.adminRole, session.user.role)) {
    redirect("/403")
  }

  const notifications = await getAdminNotificationCount()

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar notifications={notifications} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
