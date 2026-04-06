export type AdminRoleValue = "user" | "admin" | "super_admin"

const ADMIN_PANEL_ROLES = new Set<AdminRoleValue>(["admin", "super_admin"])
const LEGACY_ADMIN_ROLES = new Set(["ADMIN", "OWNER"])

export function normalizeAdminRole(
  adminRole: string | null | undefined,
  legacyRole?: string | null
): AdminRoleValue {
  if (adminRole === "admin" || adminRole === "super_admin" || adminRole === "user") {
    return adminRole
  }

  if (legacyRole === "OWNER") {
    return "super_admin"
  }

  if (legacyRole === "ADMIN") {
    return "admin"
  }

  return "user"
}

export function hasAdminPanelAccess(
  adminRole: string | null | undefined,
  legacyRole?: string | null
): boolean {
  if (adminRole && ADMIN_PANEL_ROLES.has(adminRole as AdminRoleValue)) {
    return true
  }

  if (legacyRole && LEGACY_ADMIN_ROLES.has(legacyRole)) {
    return true
  }

  return false
}

export function isSuperAdmin(
  adminRole: string | null | undefined,
  legacyRole?: string | null
): boolean {
  return adminRole === "super_admin" || legacyRole === "OWNER"
}
