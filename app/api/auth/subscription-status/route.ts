import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ access: false, reason: "unauthenticated" })
    }

    // Solo super_admins tienen acceso sin suscripción
    if (session.user.adminRole === "super_admin") {
      return NextResponse.json({ access: true, reason: "admin" })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        businessId: true,
        business: {
          select: {
            isDemo: true,
            subscriptionARS: {
              select: {
                status: true,
                freeTrial: true,
                trialEndsAt: true,
              }
            }
          }
        }
      }
    })

    if (!user?.businessId || !user.business) {
      return NextResponse.json({ access: false, reason: "no_business" })
    }

    // Demo siempre tiene acceso
    if (user.business.isDemo) {
      return NextResponse.json({ access: true, reason: "demo" })
    }

    const sub = user.business.subscriptionARS
    const now = new Date()

    if (!sub) {
      return NextResponse.json({ access: false, reason: "no_subscription" })
    }

    if (sub.status === "active") {
      return NextResponse.json({ access: true, reason: "active" })
    }

    if (sub.freeTrial && sub.trialEndsAt && sub.trialEndsAt > now) {
      const daysLeft = Math.ceil((sub.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return NextResponse.json({ access: true, reason: "trial", daysLeft })
    }

    return NextResponse.json({
      access: false,
      reason: sub.freeTrial ? "trial_expired" : sub.status
    })

  } catch {
    return NextResponse.json({ access: true, reason: "error" })
  }
}
