-- Migration: add_business_to_products
-- Objetivo: Agregar relación de negocio a productos para multi-tenancy
-- Estrategia: Migración segura sin pérdida de datos

-- ========================================
-- PASO 1: Agregar columna businessId como OPCIONAL (nullable)
-- ========================================
ALTER TABLE "products" ADD COLUMN "businessId" TEXT;

-- ========================================
-- PASO 2: Poblar businessId para productos existentes
-- ========================================
-- Estrategia: Asignar todos los productos al primer negocio disponible
-- En producción, ajustar esta lógica según necesidad específica

DO $$
DECLARE
  first_business_id TEXT;
BEGIN
  -- Obtener el primer business disponible
  SELECT id INTO first_business_id FROM "businesses" LIMIT 1;
  
  -- Si existe al menos un business, asignar todos los productos a ese business
  IF first_business_id IS NOT NULL THEN
    UPDATE "products" 
    SET "businessId" = first_business_id 
    WHERE "businessId" IS NULL;
  ELSE
    -- Si no hay businesses, crear uno temporal (en desarrollo)
    INSERT INTO "businesses" (
      id, 
      name, 
      email, 
      "ownerId",
      "planType",
      "createdAt",
      "updatedAt"
    ) 
    VALUES (
      gen_random_uuid()::text,
      'Negocio Principal',
      'admin@vendimax.com',
      (SELECT id FROM "users" LIMIT 1), -- Usar primer usuario como owner
      'FREE',
      NOW(),
      NOW()
    )
    RETURNING id INTO first_business_id;
    
    -- Asignar productos al business recién creado
    UPDATE "products" 
    SET "businessId" = first_business_id;
  END IF;
END $$;

-- ========================================
-- PASO 3: Hacer businessId OBLIGATORIO (NOT NULL)
-- ========================================
ALTER TABLE "products" ALTER COLUMN "businessId" SET NOT NULL;

-- ========================================
-- PASO 4: Crear Foreign Key constraint
-- ========================================
ALTER TABLE "products" 
  ADD CONSTRAINT "products_businessId_fkey" 
  FOREIGN KEY ("businessId") 
  REFERENCES "businesses"("id") 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

-- ========================================
-- PASO 5: Eliminar constraints antiguos (sku y barcode únicos globales)
-- ========================================
-- Eliminar índice único global de sku
DROP INDEX IF EXISTS "products_sku_key";

-- Eliminar índice único global de barcode
DROP INDEX IF EXISTS "products_barcode_key";

-- ========================================
-- PASO 6: Crear nuevos índices únicos compuestos (por negocio)
-- ========================================
-- SKU único por negocio
CREATE UNIQUE INDEX "products_businessId_sku_key" 
  ON "products"("businessId", "sku");

-- Barcode único por negocio (solo si existe)
CREATE UNIQUE INDEX "products_businessId_barcode_key" 
  ON "products"("businessId", "barcode") 
  WHERE "barcode" IS NOT NULL;

-- ========================================
-- PASO 7: Crear índices de performance
-- ========================================
-- Índice principal por businessId
CREATE INDEX "products_businessId_idx" 
  ON "products"("businessId");

-- Índice compuesto para filtros comunes
CREATE INDEX "products_businessId_isActive_idx" 
  ON "products"("businessId", "isActive");

-- Índice para productos por categoría y negocio
CREATE INDEX "products_businessId_categoryId_idx" 
  ON "products"("businessId", "categoryId");

-- ========================================
-- PASO 8: Eliminar índices antiguos redundantes
-- ========================================
DROP INDEX IF EXISTS "products_sku_idx";
DROP INDEX IF EXISTS "products_barcode_idx";
DROP INDEX IF EXISTS "products_isActive_idx";
