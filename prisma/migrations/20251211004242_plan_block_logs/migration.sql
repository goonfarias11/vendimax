-- CreateTable
CREATE TABLE "plan_block_logs" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_block_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "plan_block_logs_businessId_idx" ON "plan_block_logs"("businessId");

-- CreateIndex
CREATE INDEX "plan_block_logs_type_idx" ON "plan_block_logs"("type");

-- CreateIndex
CREATE INDEX "plan_block_logs_createdAt_idx" ON "plan_block_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "plan_block_logs" ADD CONSTRAINT "plan_block_logs_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
