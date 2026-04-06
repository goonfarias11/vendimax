import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST as salePost } from "@/app/api/sales/route"

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => ({ user: { id: "u1", role: "ADMIN", businessId: "t1" } })),
}))
vi.mock("@/lib/security/tenant", () => ({
  requireTenant: vi.fn(async () => ({ authorized: true, tenant: "t1" })),
}))
vi.mock("@/lib/auth-middleware", () => ({
  requirePermission: vi.fn(async () => ({ authorized: true })),
}))
vi.mock("@/lib/rateLimit", () => ({
  salesRateLimit: vi.fn(async () => ({ success: true, limit: 100, reset: new Date(), remaining: 99 })),
}))
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn() } }))

const tx = {
  sale: { create: vi.fn(async () => ({ id: "sale1" })) },
  branch: { findFirst: vi.fn(async () => ({ id: "b1" })) },
  warehouse: { findFirst: vi.fn(async () => ({ id: "w1" })) },
  productStock: {
    upsert: vi.fn(),
    updateMany: vi.fn(),
  },
  variantStock: {
    upsert: vi.fn(),
    updateMany: vi.fn(),
  },
  saleItem: { create: vi.fn() },
  stockMovement: { create: vi.fn() },
  cashMovement: { create: vi.fn() },
  client: { update: vi.fn() },
}

const prismaMock = {
  $transaction: async (fn: any) => fn(tx),
}

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))

const body = {
  clientId: null,
  paymentMethod: "EFECTIVO",
  items: [
    {
      productId: "p1",
      quantity: 2,
      unitPrice: 10,
      subtotal: 20,
    },
  ],
}

describe("Productos simples", () => {
  beforeEach(() => {
    Object.values(tx).forEach((grp: any) =>
      Object.values(grp).forEach((fn: any) => {
        if (typeof fn.mockReset === "function") fn.mockReset()
      }),
    )
    tx.productStock.updateMany.mockResolvedValue({ count: 1 })
  })

  it("reduce stock en ProductStock para ventas sin variante", async () => {
    const req = new Request("http://localhost/api/sales", { method: "POST", body: JSON.stringify(body) }) as any
    const res = await salePost(req)
    expect(res.status).toBe(201)
    expect(tx.productStock.updateMany).toHaveBeenCalled()
    expect(tx.variantStock.updateMany).not.toHaveBeenCalled()
  })
})
