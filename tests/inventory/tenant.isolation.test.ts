import { describe, it, expect } from "vitest"
import { runWithTenant, getTenantId } from "@/lib/tenant-context"

describe("Aislamiento multi-tenant", () => {
  it("runWithTenant propaga tenant en contexto", async () => {
    await runWithTenant("t1", async () => {
      expect(getTenantId()).toBe("t1")
    })
  })
})
