"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminIndexPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/admin/dashboard")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600"></div>
    </div>
  )
}
