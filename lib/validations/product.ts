import { z } from "zod";

export const createProductVariantSchema = z.object({
  productId: z.string().min(1, "Product ID es requerido"),
  name: z.string().min(1, "Nombre es requerido"),
  attributes: z.record(z.string(), z.any()).optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  stock: z.number().int().min(0).default(0),
  price: z.number().positive("El precio debe ser positivo"),
  cost: z.number().positive("El costo debe ser positivo"),
});

export const updateProductVariantSchema = z.object({
  name: z.string().min(1).optional(),
  attributes: z.record(z.string(), z.any()).optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  stock: z.number().int().min(0).optional(),
  price: z.number().positive().optional(),
  cost: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

export const createStockMovementSchema = z.object({
  productId: z.string().min(1, "Product ID es requerido"),
  type: z.enum(["ENTRADA", "SALIDA", "AJUSTE", "TRANSFERENCIA"]),
  quantity: z.number().int(),
  reason: z.string().optional(),
  reference: z.string().optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1, "Nombre es requerido"),
  sku: z.string().min(1, "SKU es requerido"),
  barcode: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive("El precio debe ser positivo"),
  wholesalePrice: z.number().positive().optional(),
  cost: z.number().positive("El costo debe ser positivo"),
  stock: z.number().int().min(0).default(0),
  minStock: z.number().int().min(0).default(0),
  maxStock: z.number().int().min(0).optional(),
  categoryId: z.string().optional(),
  image: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
  unit: z.string().default("unidad"),
  taxRate: z.number().min(0).max(100).default(21),
  isActive: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();
