-- CreateTable
CREATE TABLE "webhook_logs" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'mercadopago',
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'received',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "webhook_logs_type_idx" ON "webhook_logs"("type");

-- CreateIndex
CREATE INDEX "webhook_logs_source_idx" ON "webhook_logs"("source");

-- CreateIndex
CREATE INDEX "webhook_logs_status_idx" ON "webhook_logs"("status");

-- CreateIndex
CREATE INDEX "webhook_logs_createdAt_idx" ON "webhook_logs"("createdAt");
