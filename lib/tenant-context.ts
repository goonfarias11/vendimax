import { AsyncLocalStorage } from "async_hooks"

type TenantStore = { businessId: string }

export const tenantContext = new AsyncLocalStorage<TenantStore>()

export function runWithTenant<T>(businessId: string, fn: () => Promise<T>): Promise<T> {
  return tenantContext.run({ businessId }, fn)
}

export function getTenantId(): string | undefined {
  return tenantContext.getStore()?.businessId
}
