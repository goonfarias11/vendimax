-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('EMPRENDEDOR', 'PYME', 'FULL');

-- CreateEnum
CREATE TYPE "PaymentPeriod" AS ENUM ('MENSUAL', 'ANUAL', 'UNICO');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDIENTE', 'PAGADO', 'RECHAZADO', 'VENCIDO', 'CANCELADO');

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "priceMonthly" DECIMAL(10,2) NOT NULL,
    "priceYearly" DECIMAL(10,2) NOT NULL,
    "setupFee" DECIMAL(10,2) NOT NULL DEFAULT 60000,
    "maxUsers" INTEGER,
    "maxProducts" INTEGER,
    "maxSales" INTEGER,
    "features" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "priceMonthly" DECIMAL(10,2) NOT NULL,
    "features" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions_ars" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "setupFeePaid" BOOLEAN NOT NULL DEFAULT false,
    "setupFeeAmount" DECIMAL(10,2),
    "setupFeePaidAt" TIMESTAMP(3),
    "priceMonthly" DECIMAL(10,2) NOT NULL,
    "priceYearly" DECIMAL(10,2),
    "totalAddons" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalMonthly" DECIMAL(10,2) NOT NULL,
    "mercadopagoPreapprovalId" TEXT,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_ars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_addons" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "addonId" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivatedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "subscription_addons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "type" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "mercadopagoPaymentId" TEXT,
    "mercadopagoStatus" TEXT,
    "transferReceipt" TEXT,
    "invoiceNumber" TEXT,
    "paidAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_adjustments" (
    "id" TEXT NOT NULL,
    "planId" TEXT,
    "addonId" TEXT,
    "previousPrice" DECIMAL(10,2) NOT NULL,
    "newPrice" DECIMAL(10,2) NOT NULL,
    "percentage" DECIMAL(5,2),
    "reason" TEXT NOT NULL,
    "ipcValue" DECIMAL(5,2),
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedBy" TEXT NOT NULL,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_slug_key" ON "subscription_plans"("slug");

-- CreateIndex
CREATE INDEX "subscription_plans_slug_idx" ON "subscription_plans"("slug");

-- CreateIndex
CREATE INDEX "subscription_plans_isActive_idx" ON "subscription_plans"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "addons_slug_key" ON "addons"("slug");

-- CreateIndex
CREATE INDEX "addons_slug_idx" ON "addons"("slug");

-- CreateIndex
CREATE INDEX "addons_isActive_idx" ON "addons"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_ars_businessId_key" ON "subscriptions_ars"("businessId");

-- CreateIndex
CREATE INDEX "subscriptions_ars_businessId_idx" ON "subscriptions_ars"("businessId");

-- CreateIndex
CREATE INDEX "subscriptions_ars_planId_idx" ON "subscriptions_ars"("planId");

-- CreateIndex
CREATE INDEX "subscriptions_ars_status_idx" ON "subscriptions_ars"("status");

-- CreateIndex
CREATE INDEX "subscription_addons_subscriptionId_idx" ON "subscription_addons"("subscriptionId");

-- CreateIndex
CREATE INDEX "subscription_addons_addonId_idx" ON "subscription_addons"("addonId");

-- CreateIndex
CREATE INDEX "payments_subscriptionId_idx" ON "payments"("subscriptionId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_mercadopagoPaymentId_idx" ON "payments"("mercadopagoPaymentId");

-- CreateIndex
CREATE INDEX "price_adjustments_planId_idx" ON "price_adjustments"("planId");

-- CreateIndex
CREATE INDEX "price_adjustments_addonId_idx" ON "price_adjustments"("addonId");

-- AddForeignKey
ALTER TABLE "subscriptions_ars" ADD CONSTRAINT "subscriptions_ars_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions_ars" ADD CONSTRAINT "subscriptions_ars_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_addons" ADD CONSTRAINT "subscription_addons_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions_ars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_addons" ADD CONSTRAINT "subscription_addons_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "addons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions_ars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_adjustments" ADD CONSTRAINT "price_adjustments_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_adjustments" ADD CONSTRAINT "price_adjustments_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "addons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
