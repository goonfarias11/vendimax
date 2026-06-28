"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminTopbar } from "@/components/admin/admin-topbar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const adminRole = (session?.user as any)?.adminRole
  const role = (session?.user as any)?.role

  useEffect(() => {
    if (status === "loading") return

    if (!session?.user) {
      router.push("/login?next=/admin")
      return
    }

    const hasAccess =
      adminRole === "super_admin" ||
      adminRole === "admin" ||
      role === "OWNER" ||
      role === "ADMIN"

    if (!hasAccess) {
      router.push("/403")
    }
  }, [status, session, adminRole, role, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600"></div>
      </div>
    )
  }

  const hasAccess =
    adminRole === "super_admin" ||
    adminRole === "admin" ||
    role === "OWNER" ||
    role === "ADMIN"

  if (!session?.user || !hasAccess) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar notifications={0} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
