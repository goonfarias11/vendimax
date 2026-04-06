import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import type { Session } from "next-auth"
import { tenantContext } from "@/lib/tenant-context"

type TenantResult =
  | { authorized: true; tenant: string }
  | { authorized: false; response: NextResponse }

/**
 * Obtiene el tenant (businessId) desde la sesión.
 * - Sin sesión -> 401
 * - Sin businessId -> 403
 */
export async function requireTenant(session?: Session | null): Promise<TenantResult> {
  const currentSession = session ?? (await auth())

  if (!currentSession?.user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    }
  }

  const tenant = currentSession.user.businessId

  if (!tenant) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Tenant not assigned" }, { status: 403 }),
    }
  }

  // Establecer tenant en AsyncLocalStorage para uso de middlewares (Prisma)
  tenantContext.enterWith({ businessId: tenant })

  return { authorized: true, tenant }
}

/**
 * Obtiene tenant a partir de la request (lee la sesión internamente).
 * Útil en handlers que no reciben la sesión.
 */
export async function getTenantFromRequest(): Promise<TenantResult> {
  return requireTenant()
}
