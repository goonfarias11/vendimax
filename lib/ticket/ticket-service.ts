import { prisma } from "@/lib/prisma"

export async function getTicketDataBySaleId(saleId: string, businessId: string) {
  const sale = await prisma.sale.findFirst({
    where: { id: saleId, businessId },
    include: {
      user: { select: { name: true } },
      client: { select: { name: true } },
      saleItems: {
        select: {
          id: true,
          quantity: true,
          price: true,
          subtotal: true,
          product: { select: { name: true } },
        },
      },
    },
  })

  if (!sale) return null

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      name: true,
      taxId: true,
      address: true,
      phone: true,
      logo: true,
    },
  })

  return {
    ticketNumber: sale.ticketNumber ?? sale.id,
    createdAt: sale.createdAt.toISOString(),
    business: business || {
      name: "VendiMax",
      logo: null,
      taxId: null,
      address: null,
      phone: null,
    },
    cashier: sale.user?.name || "Usuario",
    client: sale.client?.name || "Consumidor final",
    paymentMethod: sale.paymentMethod,
    subtotal: Number(sale.subtotal),
    discount: Number(sale.discount || 0),
    tax: Number(sale.tax || 0),
    total: Number(sale.total),
    items: sale.saleItems.map((item) => ({
      id: item.id,
      name: item.product.name,
      quantity: item.quantity,
      unitPrice: Number(item.price),
      subtotal: Number(item.subtotal),
    })),
  }
}
