"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminTopbar } from "@/components/admin/admin-topbar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    if (status === "loading") return

    const adminRole = (session?.user as any)?.adminRole
    const role = (session?.user as any)?.role

    if (!session?.user) {
      router.replace("/login?next=/admin")
      return
    }

    const hasAccess =
      adminRole === "super_admin" ||
      adminRole === "admin" ||
      role === "OWNER" ||
      role === "ADMIN"

    if (hasAccess) {
      setAuthorized(true)
    } else {
      router.replace("/dashboard")
    }
  }, [status, session, router])

  if (status === "loading" || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600"></div>
      </div>
    )
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
