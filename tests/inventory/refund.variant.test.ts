import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST as refundPost } from "@/app/api/sales/[id]/refund/route"

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => ({ user: { id: "u1", businessId: "t1" } })),
}))
vi.mock("@/lib/security/tenant", () => ({
  requireTenant: vi.fn(async () => ({ authorized: true, tenant: "t1" })),
}))
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn() } }))

const tx = {
  sale: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  refund: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  refundItem: {
    create: vi.fn(),
    aggregate: vi.fn(),
  },
  variantStock: {
    updateMany: vi.fn(),
  },
  productStock: {
    upsert: vi.fn(),
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
  warehouse: { findFirst: vi.fn() },
}

const prismaMock = {
  $transaction: async (fn: any) => fn(tx),
  refund: { findUnique: vi.fn() },
  refundItem: { aggregate: vi.fn() },
}

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))

const baseBody = {
  saleId: "sale1",
  type: "TOTAL",
  reason: "producto defectuoso",
  refundAmount: 20,
  restockItems: true,
  items: [
    {
      saleItemId: "si1",
      productId: "p1",
      variantId: "v1",
      quantity: 2,
      price: 10,
      subtotal: 20,
    },
  ],
}

describe("Refund de variantes", () => {
  beforeEach(() => {
    Object.values(tx).forEach((grp: any) =>
      Object.values(grp).forEach((fn: any) => {
        if (typeof fn.mockReset === "function") fn.mockReset()
      }),
    )
    tx.sale.findFirst.mockResolvedValue({
      id: "sale1",
      businessId: "t1",
      warehouseId: "w1",
      status: "COMPLETADO",
      total: 20,
      paymentMethod: "EFECTIVO",
      refunds: [],
      saleItems: [
        {
          id: "si1",
          productId: "p1",
          variantId: "v1",
          quantity: 2,
          product: { name: "prod" },
        },
      ],
      ticketNumber: 1,
    })
    tx.refundItem.aggregate.mockResolvedValue({ _sum: { quantity: 0 } })
    tx.variantStock.updateMany.mockResolvedValue({ count: 1 })
    tx.warehouse.findFirst.mockResolvedValue({ id: "w1" })
  })

  it("restaura stock en VariantStock", async () => {
    const req = new Request("http://localhost/api/sales/sale1/refund", {
      method: "POST",
      body: JSON.stringify(baseBody),
    }) as any
    const res = await refundPost(req, { params: Promise.resolve({ id: "sale1" }) })
    expect(res.status).toBe(201)
    expect(tx.variantStock.updateMany).toHaveBeenCalled()
  })
})
