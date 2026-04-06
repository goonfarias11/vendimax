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
  sale: {
    create: vi.fn(async () => ({ id: "sale1" })),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  branch: {
    findFirst: vi.fn(async () => ({ id: "b1" })),
  },
  warehouse: {
    findFirst: vi.fn(async () => ({ id: "w1" })),
  },
  variantStock: {
    upsert: vi.fn(),
    updateMany: vi.fn(),
  },
  productStock: {
    upsert: vi.fn(),
    updateMany: vi.fn(),
  },
  saleItem: {
    create: vi.fn(),
  },
  stockMovement: {
    create: vi.fn(),
  },
  cashMovement: {
    create: vi.fn(),
  },
  client: {
    update: vi.fn(),
  },
}

const prismaMock = {
  $transaction: async (fn: any) => fn(tx),
  sale: {
    findFirst: vi.fn(),
  },
  branch: { findFirst: vi.fn(async () => ({ id: "b1" })) },
  warehouse: { findFirst: vi.fn(async () => ({ id: "w1" })) },
}

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))

const baseBody = {
  clientId: null,
  paymentMethod: "EFECTIVO",
  items: [
    {
      productId: "p1",
      variantId: "v1",
      quantity: 3,
      unitPrice: 10,
      subtotal: 30,
    },
  ],
  discount: 0,
  discountType: "fixed",
  hasMixedPayment: false,
  payments: [],
}

describe("Ventas con variantes", () => {
  beforeEach(() => {
    Object.values(tx).forEach((grp: any) =>
      Object.values(grp).forEach((fn: any) => {
        if (typeof fn.mockReset === "function") fn.mockReset()
      }),
    )
    tx.variantStock.updateMany.mockResolvedValue({ count: 1 })
    tx.productStock.updateMany.mockResolvedValue({ count: 1 })
  })

  it("reduce stock de VariantStock", async () => {
    const req = new Request("http://localhost/api/sales", { method: "POST", body: JSON.stringify(baseBody) }) as any
    const res = await salePost(req)
    expect(res.status).toBe(201)
    expect(tx.variantStock.updateMany).toHaveBeenCalled()
  })

  it("falla si no hay stock suficiente", async () => {
    tx.variantStock.updateMany.mockResolvedValue({ count: 0 })
    const req = new Request("http://localhost/api/sales", { method: "POST", body: JSON.stringify(baseBody) }) as any
    const res = await salePost(req)
    expect(res.status).toBe(500)
  })
})
