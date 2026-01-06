import { z } from "zod";

export const purchaseItemSchema = z.object({
  productId: z.string().min(1, "Product ID es requerido"),
  quantity: z.number().int().positive("La cantidad debe ser positiva"),
  cost: z.number().positive("El costo debe ser positivo"),
  subtotal: z.number().positive("El subtotal debe ser positivo"),
});

export const createPurchaseSchema = z.object({
  supplierId: z.string().min(1, "Proveedor es requerido"),
  items: z.array(purchaseItemSchema).min(1, "Debe incluir al menos un producto"),
  subtotal: z.number().positive("El subtotal debe ser positivo"),
  tax: z.number().min(0).default(0),
  total: z.number().positive("El total debe ser positivo"),
  invoiceNum: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const receivePurchaseSchema = z.object({
  received: z.boolean().default(true),
  receivedDate: z.string().optional(),
  notes: z.string().optional(),
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
export type PurchaseItemInput = z.infer<typeof purchaseItemSchema>;
export type ReceivePurchaseInput = z.infer<typeof receivePurchaseSchema>;
