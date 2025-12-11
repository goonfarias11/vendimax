-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "cashClosingId" TEXT;

-- CreateTable
CREATE TABLE "cash_closings" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "from" TIMESTAMP(3) NOT NULL,
    "to" TIMESTAMP(3) NOT NULL,
    "totalCash" DECIMAL(10,2) NOT NULL,
    "totalCard" DECIMAL(10,2) NOT NULL,
    "totalTransfer" DECIMAL(10,2) NOT NULL,
    "totalGeneral" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "responsibleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_closings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cash_closings_responsibleId_idx" ON "cash_closings"("responsibleId");

-- CreateIndex
CREATE INDEX "cash_closings_from_idx" ON "cash_closings"("from");

-- CreateIndex
CREATE INDEX "cash_closings_to_idx" ON "cash_closings"("to");

-- CreateIndex
CREATE INDEX "cash_closings_number_idx" ON "cash_closings"("number");

-- CreateIndex
CREATE INDEX "cash_closings_createdAt_idx" ON "cash_closings"("createdAt");

-- CreateIndex
CREATE INDEX "sales_cashClosingId_idx" ON "sales"("cashClosingId");

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_cashClosingId_fkey" FOREIGN KEY ("cashClosingId") REFERENCES "cash_closings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_closings" ADD CONSTRAINT "cash_closings_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
