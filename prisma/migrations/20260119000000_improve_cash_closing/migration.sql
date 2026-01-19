-- Mejorar modelo de CashRegister para cierre más profesional
ALTER TABLE "cash_registers" ADD COLUMN IF NOT EXISTS "totalMixedPayments" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "cash_registers" ADD COLUMN IF NOT EXISTS "totalRefunds" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "cash_registers" ADD COLUMN IF NOT EXISTS "totalInvoiced" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "cash_registers" ADD COLUMN IF NOT EXISTS "totalNotInvoiced" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "cash_registers" ADD COLUMN IF NOT EXISTS "refundsCount" INTEGER DEFAULT 0;
ALTER TABLE "cash_registers" ADD COLUMN IF NOT EXISTS "closedBy" TEXT;
ALTER TABLE "cash_registers" ADD COLUMN IF NOT EXISTS "requiresAuthorization" BOOLEAN DEFAULT FALSE;
ALTER TABLE "cash_registers" ADD COLUMN IF NOT EXISTS "authorizedBy" TEXT;
ALTER TABLE "cash_registers" ADD COLUMN IF NOT EXISTS "authorizedAt" TIMESTAMP(3);

-- Mejorar modelo de CashClosing
ALTER TABLE "cash_closings" ADD COLUMN IF NOT EXISTS "salesCount" INTEGER DEFAULT 0;
ALTER TABLE "cash_closings" ADD COLUMN IF NOT EXISTS "totalMixedPayments" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "cash_closings" ADD COLUMN IF NOT EXISTS "totalRefunds" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "cash_closings" ADD COLUMN IF NOT EXISTS "refundsCount" INTEGER DEFAULT 0;
ALTER TABLE "cash_closings" ADD COLUMN IF NOT EXISTS "totalInvoiced" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "cash_closings" ADD COLUMN IF NOT EXISTS "totalNotInvoiced" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "cash_closings" ADD COLUMN IF NOT EXISTS "cashCounted" DECIMAL(10,2);
ALTER TABLE "cash_closings" ADD COLUMN IF NOT EXISTS "cashExpected" DECIMAL(10,2);
ALTER TABLE "cash_closings" ADD COLUMN IF NOT EXISTS "cashDifference" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "cash_closings" ADD COLUMN IF NOT EXISTS "closedById" TEXT;
ALTER TABLE "cash_closings" ADD COLUMN IF NOT EXISTS "businessId" TEXT;

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS "cash_registers_closedBy_idx" ON "cash_registers"("closedBy");
CREATE INDEX IF NOT EXISTS "cash_closings_closedById_idx" ON "cash_closings"("closedById");
CREATE INDEX IF NOT EXISTS "cash_closings_businessId_idx" ON "cash_closings"("businessId");

-- Foreign keys
ALTER TABLE "cash_closings" ADD CONSTRAINT "cash_closings_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cash_closings" ADD CONSTRAINT "cash_closings_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
