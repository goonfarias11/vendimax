-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'VENDEDOR', 'GERENTE', 'SUPERVISOR', 'OWNER');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('user', 'admin', 'super_admin');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('open', 'pending', 'solved', 'closed');

-- CreateEnum
CREATE TYPE "SupportPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "SystemLogLevel" AS ENUM ('info', 'warning', 'error', 'critical');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('FREE', 'BASICO', 'STARTER', 'PRO', 'ENTERPRISE', 'FULL');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'UNPAID');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('EFECTIVO', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'TRANSFERENCIA', 'QR', 'CUENTA_CORRIENTE', 'MIXTO', 'OTRO');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('COMPLETADO', 'PENDIENTE', 'CANCELADO', 'REEMBOLSADO', 'PARCIALMENTE_REEMBOLSADO');

-- CreateEnum
CREATE TYPE "RefundType" AS ENUM ('TOTAL', 'PARCIAL');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'DELINQUENT', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "CashMovementType" AS ENUM ('APERTURA', 'CIERRE', 'INGRESO', 'EGRESO', 'VENTA', 'SALIDA');

-- CreateEnum
CREATE TYPE "CashRegisterStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('EMPRENDEDOR', 'PYME', 'FULL');

-- CreateEnum
CREATE TYPE "PaymentPeriod" AS ENUM ('MENSUAL', 'ANUAL', 'UNICO');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDIENTE', 'PAGADO', 'RECHAZADO', 'VENCIDO', 'CANCELADO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VENDEDOR',
    "adminRole" "AdminRole" NOT NULL DEFAULT 'user',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "company" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "businessId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "businesses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "taxId" TEXT,
    "logo" TEXT,
    "ownerId" TEXT NOT NULL,
    "planType" "PlanType" NOT NULL DEFAULT 'BASICO',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "planType" "PlanType" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "mpPreapprovalId" TEXT,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "trialEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "status" TEXT NOT NULL,
    "mpPaymentId" TEXT,
    "invoiceNumber" TEXT,
    "invoiceUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "priceMonthly" DECIMAL(10,2) NOT NULL,
    "priceYearly" DECIMAL(10,2) NOT NULL,
    "setupFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "maxUsers" INTEGER,
    "maxProducts" INTEGER,
    "maxSales" INTEGER,
    "features" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hasAPI" BOOLEAN NOT NULL DEFAULT false,
    "hasAdvancedReports" BOOLEAN NOT NULL DEFAULT false,
    "hasCurrentAccounts" BOOLEAN NOT NULL DEFAULT false,
    "hasIntegrations" BOOLEAN NOT NULL DEFAULT false,
    "isMostPopular" BOOLEAN NOT NULL DEFAULT false,
    "maxLocations" INTEGER,
    "supportLevel" TEXT NOT NULL DEFAULT 'email',

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
    "planTier" "PlanTier",
    "status" TEXT NOT NULL DEFAULT 'pending',
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "freeTrial" BOOLEAN NOT NULL DEFAULT false,
    "trialEndsAt" TIMESTAMP(3),
    "trialNotificationSent" BOOLEAN NOT NULL DEFAULT false,
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
    "transferProof" TEXT,
    "transferReference" TEXT,
    "adminNotes" TEXT,
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

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "wholesalePrice" DECIMAL(10,2),
    "cost" DECIMAL(10,2) NOT NULL,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "maxStock" INTEGER,
    "categoryId" TEXT,
    "image" TEXT,
    "images" TEXT[],
    "unit" TEXT DEFAULT 'unidad',
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 21,
    "hasVariants" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT,
    "cashClosingId" TEXT,
    "branchId" TEXT,
    "warehouseId" TEXT,
    "total" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discountType" TEXT,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "hasMixedPayment" BOOLEAN NOT NULL DEFAULT false,
    "status" "SaleStatus" NOT NULL DEFAULT 'COMPLETADO',
    "notes" TEXT,
    "ticketNumber" INTEGER,
    "requiresInvoice" BOOLEAN NOT NULL DEFAULT false,
    "invoiceType" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,
    "cashRegisterId" TEXT,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_items" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "businessId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "RefundType" NOT NULL,
    "reason" TEXT NOT NULL,
    "refundAmount" DECIMAL(10,2) NOT NULL,
    "restockItems" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refund_items" (
    "id" TEXT NOT NULL,
    "refundId" TEXT NOT NULL,
    "saleItemId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refund_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "taxId" TEXT,
    "notes" TEXT,
    "creditLimit" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currentDebt" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,
    "lastPurchaseAt" TIMESTAMP(3),
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hasCreditAccount" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_payments" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_activity_logs" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "userId" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "taxId" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchases" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "warehouseId" TEXT,
    "total" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "invoiceNum" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_items" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_movements" (
    "id" TEXT NOT NULL,
    "type" "CashMovementType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "reference" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "businessId" TEXT NOT NULL,
    "cashRegisterId" TEXT,
    "isAnulado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "cash_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_registers" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "status" "CashRegisterStatus" NOT NULL DEFAULT 'OPEN',
    "openingAmount" DECIMAL(10,2) NOT NULL,
    "closingAmount" DECIMAL(10,2),
    "expectedAmount" DECIMAL(10,2),
    "difference" DECIMAL(10,2),
    "totalCash" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalCard" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalTransfer" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalOther" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalMixedPayments" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalRefunds" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalInvoiced" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalNotInvoiced" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "salesCount" INTEGER NOT NULL DEFAULT 0,
    "refundsCount" INTEGER NOT NULL DEFAULT 0,
    "closedBy" TEXT,
    "requiresAuthorization" BOOLEAN NOT NULL DEFAULT false,
    "authorizedBy" TEXT,
    "authorizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_registers_pkey" PRIMARY KEY ("id")
);

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
    "totalMixedPayments" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalRefunds" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalInvoiced" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalNotInvoiced" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "salesCount" INTEGER NOT NULL DEFAULT 0,
    "refundsCount" INTEGER NOT NULL DEFAULT 0,
    "cashCounted" DECIMAL(10,2),
    "cashExpected" DECIMAL(10,2),
    "cashDifference" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "responsibleId" TEXT NOT NULL,
    "closedById" TEXT,
    "businessId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_closings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "attributes" JSONB NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_stocks" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "available" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variant_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "warehouseId" TEXT,
    "type" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "reference" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_payments" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_payments_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_stocks" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "available" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "conditions" JSONB NOT NULL,
    "discount" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "maxUses" INTEGER,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhooks" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT[],
    "secret" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastCalledAt" TIMESTAMP(3),
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "businessId" TEXT,
    "subject" TEXT NOT NULL,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'open',
    "priority" "SupportPriority" NOT NULL DEFAULT 'medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_messages" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT,
    "message" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_logs" (
    "id" TEXT NOT NULL,
    "level" "SystemLogLevel" NOT NULL DEFAULT 'info',
    "category" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "actorUserId" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "platformName" TEXT NOT NULL DEFAULT 'VendiMax',
    "featureFlags" JSONB NOT NULL DEFAULT '{}',
    "emailSystem" JSONB NOT NULL DEFAULT '{}',
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "afip_configs" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "cuit" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "cert" TEXT,
    "key" TEXT,
    "certPath" TEXT,
    "keyPath" TEXT,
    "production" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "afip_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points_of_sale" (
    "id" TEXT NOT NULL,
    "afipConfigId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "emissionType" TEXT NOT NULL DEFAULT 'CAE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "points_of_sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "afip_invoices" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "pointOfSaleId" TEXT NOT NULL,
    "voucherType" INTEGER NOT NULL,
    "voucherNumber" INTEGER NOT NULL,
    "cae" TEXT NOT NULL,
    "caeDueDate" TEXT NOT NULL,
    "invoiceDate" TEXT NOT NULL,
    "documentType" INTEGER NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "netAmount" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL,
    "exemptAmount" DECIMAL(10,2) NOT NULL,
    "result" TEXT NOT NULL,
    "observations" JSONB,
    "errors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "afip_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_adminRole_idx" ON "users"("adminRole");

-- CreateIndex
CREATE INDEX "users_businessId_idx" ON "users"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "businesses_email_key" ON "businesses"("email");

-- CreateIndex
CREATE UNIQUE INDEX "businesses_ownerId_key" ON "businesses"("ownerId");

-- CreateIndex
CREATE INDEX "businesses_email_idx" ON "businesses"("email");

-- CreateIndex
CREATE INDEX "businesses_ownerId_idx" ON "businesses"("ownerId");

-- CreateIndex
CREATE INDEX "businesses_planType_idx" ON "businesses"("planType");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_businessId_key" ON "subscriptions"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_mpPreapprovalId_key" ON "subscriptions"("mpPreapprovalId");

-- CreateIndex
CREATE INDEX "subscriptions_businessId_idx" ON "subscriptions"("businessId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_mpPreapprovalId_idx" ON "subscriptions"("mpPreapprovalId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_mpPaymentId_key" ON "invoices"("mpPaymentId");

-- CreateIndex
CREATE INDEX "invoices_businessId_idx" ON "invoices"("businessId");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_mpPaymentId_idx" ON "invoices"("mpPaymentId");

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

-- CreateIndex
CREATE INDEX "webhook_logs_type_idx" ON "webhook_logs"("type");

-- CreateIndex
CREATE INDEX "webhook_logs_source_idx" ON "webhook_logs"("source");

-- CreateIndex
CREATE INDEX "webhook_logs_status_idx" ON "webhook_logs"("status");

-- CreateIndex
CREATE INDEX "webhook_logs_createdAt_idx" ON "webhook_logs"("createdAt");

-- CreateIndex
CREATE INDEX "categories_businessId_idx" ON "categories"("businessId");

-- CreateIndex
CREATE INDEX "categories_name_idx" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_businessId_name_key" ON "categories"("businessId", "name");

-- CreateIndex
CREATE INDEX "products_businessId_idx" ON "products"("businessId");

-- CreateIndex
CREATE INDEX "products_businessId_isActive_idx" ON "products"("businessId", "isActive");

-- CreateIndex
CREATE INDEX "products_businessId_categoryId_idx" ON "products"("businessId", "categoryId");

-- CreateIndex
CREATE INDEX "products_name_idx" ON "products"("name");

-- CreateIndex
CREATE UNIQUE INDEX "products_businessId_sku_key" ON "products"("businessId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "products_businessId_barcode_key" ON "products"("businessId", "barcode");

-- CreateIndex
CREATE INDEX "sales_businessId_idx" ON "sales"("businessId");

-- CreateIndex
CREATE INDEX "sales_userId_idx" ON "sales"("userId");

-- CreateIndex
CREATE INDEX "sales_clientId_idx" ON "sales"("clientId");

-- CreateIndex
CREATE INDEX "sales_cashClosingId_idx" ON "sales"("cashClosingId");

-- CreateIndex
CREATE INDEX "sales_cashRegisterId_idx" ON "sales"("cashRegisterId");

-- CreateIndex
CREATE INDEX "sales_branchId_idx" ON "sales"("branchId");

-- CreateIndex
CREATE INDEX "sales_warehouseId_idx" ON "sales"("warehouseId");

-- CreateIndex
CREATE INDEX "sales_createdAt_idx" ON "sales"("createdAt");

-- CreateIndex
CREATE INDEX "sales_status_idx" ON "sales"("status");

-- CreateIndex
CREATE INDEX "sale_items_saleId_idx" ON "sale_items"("saleId");

-- CreateIndex
CREATE INDEX "sale_items_productId_idx" ON "sale_items"("productId");

-- CreateIndex
CREATE INDEX "sale_items_variantId_idx" ON "sale_items"("variantId");

-- CreateIndex
CREATE INDEX "sale_items_businessId_idx" ON "sale_items"("businessId");

-- CreateIndex
CREATE INDEX "refunds_saleId_idx" ON "refunds"("saleId");

-- CreateIndex
CREATE INDEX "refunds_userId_idx" ON "refunds"("userId");

-- CreateIndex
CREATE INDEX "refunds_createdAt_idx" ON "refunds"("createdAt");

-- CreateIndex
CREATE INDEX "refund_items_refundId_idx" ON "refund_items"("refundId");

-- CreateIndex
CREATE INDEX "refund_items_saleItemId_idx" ON "refund_items"("saleItemId");

-- CreateIndex
CREATE INDEX "refund_items_productId_idx" ON "refund_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "clients_email_key" ON "clients"("email");

-- CreateIndex
CREATE INDEX "clients_name_idx" ON "clients"("name");

-- CreateIndex
CREATE INDEX "clients_email_idx" ON "clients"("email");

-- CreateIndex
CREATE INDEX "clients_phone_idx" ON "clients"("phone");

-- CreateIndex
CREATE INDEX "clients_businessId_idx" ON "clients"("businessId");

-- CreateIndex
CREATE INDEX "clients_status_idx" ON "clients"("status");

-- CreateIndex
CREATE INDEX "clients_lastPurchaseAt_idx" ON "clients"("lastPurchaseAt");

-- CreateIndex
CREATE INDEX "client_payments_clientId_idx" ON "client_payments"("clientId");

-- CreateIndex
CREATE INDEX "client_payments_createdAt_idx" ON "client_payments"("createdAt");

-- CreateIndex
CREATE INDEX "client_activity_logs_clientId_idx" ON "client_activity_logs"("clientId");

-- CreateIndex
CREATE INDEX "client_activity_logs_createdAt_idx" ON "client_activity_logs"("createdAt");

-- CreateIndex
CREATE INDEX "client_activity_logs_action_idx" ON "client_activity_logs"("action");

-- CreateIndex
CREATE INDEX "suppliers_businessId_idx" ON "suppliers"("businessId");

-- CreateIndex
CREATE INDEX "suppliers_name_idx" ON "suppliers"("name");

-- CreateIndex
CREATE INDEX "suppliers_email_idx" ON "suppliers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_businessId_email_key" ON "suppliers"("businessId", "email");

-- CreateIndex
CREATE INDEX "purchases_businessId_idx" ON "purchases"("businessId");

-- CreateIndex
CREATE INDEX "purchases_supplierId_idx" ON "purchases"("supplierId");

-- CreateIndex
CREATE INDEX "purchases_userId_idx" ON "purchases"("userId");

-- CreateIndex
CREATE INDEX "purchases_warehouseId_idx" ON "purchases"("warehouseId");

-- CreateIndex
CREATE INDEX "purchases_createdAt_idx" ON "purchases"("createdAt");

-- CreateIndex
CREATE INDEX "purchase_items_purchaseId_idx" ON "purchase_items"("purchaseId");

-- CreateIndex
CREATE INDEX "purchase_items_productId_idx" ON "purchase_items"("productId");

-- CreateIndex
CREATE INDEX "cash_movements_userId_idx" ON "cash_movements"("userId");

-- CreateIndex
CREATE INDEX "cash_movements_businessId_idx" ON "cash_movements"("businessId");

-- CreateIndex
CREATE INDEX "cash_movements_cashRegisterId_idx" ON "cash_movements"("cashRegisterId");

-- CreateIndex
CREATE INDEX "cash_movements_type_idx" ON "cash_movements"("type");

-- CreateIndex
CREATE INDEX "cash_movements_createdAt_idx" ON "cash_movements"("createdAt");

-- CreateIndex
CREATE INDEX "cash_registers_businessId_idx" ON "cash_registers"("businessId");

-- CreateIndex
CREATE INDEX "cash_registers_userId_idx" ON "cash_registers"("userId");

-- CreateIndex
CREATE INDEX "cash_registers_status_idx" ON "cash_registers"("status");

-- CreateIndex
CREATE INDEX "cash_registers_openedAt_idx" ON "cash_registers"("openedAt");

-- CreateIndex
CREATE INDEX "cash_registers_closedAt_idx" ON "cash_registers"("closedAt");

-- CreateIndex
CREATE INDEX "cash_registers_closedBy_idx" ON "cash_registers"("closedBy");

-- CreateIndex
CREATE INDEX "cash_closings_responsibleId_idx" ON "cash_closings"("responsibleId");

-- CreateIndex
CREATE INDEX "cash_closings_closedById_idx" ON "cash_closings"("closedById");

-- CreateIndex
CREATE INDEX "cash_closings_businessId_idx" ON "cash_closings"("businessId");

-- CreateIndex
CREATE INDEX "cash_closings_from_idx" ON "cash_closings"("from");

-- CreateIndex
CREATE INDEX "cash_closings_to_idx" ON "cash_closings"("to");

-- CreateIndex
CREATE INDEX "cash_closings_number_idx" ON "cash_closings"("number");

-- CreateIndex
CREATE INDEX "cash_closings_createdAt_idx" ON "cash_closings"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_barcode_key" ON "product_variants"("barcode");

-- CreateIndex
CREATE INDEX "product_variants_productId_idx" ON "product_variants"("productId");

-- CreateIndex
CREATE INDEX "product_variants_sku_idx" ON "product_variants"("sku");

-- CreateIndex
CREATE INDEX "variant_stocks_businessId_idx" ON "variant_stocks"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "variant_stocks_variantId_warehouseId_key" ON "variant_stocks"("variantId", "warehouseId");

-- CreateIndex
CREATE INDEX "stock_movements_businessId_idx" ON "stock_movements"("businessId");

-- CreateIndex
CREATE INDEX "stock_movements_productId_idx" ON "stock_movements"("productId");

-- CreateIndex
CREATE INDEX "stock_movements_userId_idx" ON "stock_movements"("userId");

-- CreateIndex
CREATE INDEX "stock_movements_warehouseId_idx" ON "stock_movements"("warehouseId");

-- CreateIndex
CREATE INDEX "stock_movements_createdAt_idx" ON "stock_movements"("createdAt");

-- CreateIndex
CREATE INDEX "sale_payments_saleId_idx" ON "sale_payments"("saleId");

-- CreateIndex
CREATE INDEX "plan_block_logs_businessId_idx" ON "plan_block_logs"("businessId");

-- CreateIndex
CREATE INDEX "plan_block_logs_type_idx" ON "plan_block_logs"("type");

-- CreateIndex
CREATE INDEX "plan_block_logs_createdAt_idx" ON "plan_block_logs"("createdAt");

-- CreateIndex
CREATE INDEX "branches_businessId_idx" ON "branches"("businessId");

-- CreateIndex
CREATE INDEX "branches_isActive_idx" ON "branches"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "branches_businessId_code_key" ON "branches"("businessId", "code");

-- CreateIndex
CREATE INDEX "warehouses_branchId_idx" ON "warehouses"("branchId");

-- CreateIndex
CREATE INDEX "warehouses_isActive_idx" ON "warehouses"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_branchId_code_key" ON "warehouses"("branchId", "code");

-- CreateIndex
CREATE INDEX "product_stocks_productId_idx" ON "product_stocks"("productId");

-- CreateIndex
CREATE INDEX "product_stocks_warehouseId_idx" ON "product_stocks"("warehouseId");

-- CreateIndex
CREATE INDEX "product_stocks_stock_idx" ON "product_stocks"("stock");

-- CreateIndex
CREATE UNIQUE INDEX "product_stocks_productId_warehouseId_key" ON "product_stocks"("productId", "warehouseId");

-- CreateIndex
CREATE INDEX "promotions_businessId_idx" ON "promotions"("businessId");

-- CreateIndex
CREATE INDEX "promotions_isActive_idx" ON "promotions"("isActive");

-- CreateIndex
CREATE INDEX "promotions_startDate_endDate_idx" ON "promotions"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "promotions_type_idx" ON "promotions"("type");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "api_keys_businessId_idx" ON "api_keys"("businessId");

-- CreateIndex
CREATE INDEX "api_keys_key_idx" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "api_keys_isActive_idx" ON "api_keys"("isActive");

-- CreateIndex
CREATE INDEX "webhooks_businessId_idx" ON "webhooks"("businessId");

-- CreateIndex
CREATE INDEX "webhooks_isActive_idx" ON "webhooks"("isActive");

-- CreateIndex
CREATE INDEX "audit_logs_businessId_idx" ON "audit_logs"("businessId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"("entity");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "support_tickets_userId_idx" ON "support_tickets"("userId");

-- CreateIndex
CREATE INDEX "support_tickets_businessId_idx" ON "support_tickets"("businessId");

-- CreateIndex
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");

-- CreateIndex
CREATE INDEX "support_tickets_priority_idx" ON "support_tickets"("priority");

-- CreateIndex
CREATE INDEX "support_tickets_createdAt_idx" ON "support_tickets"("createdAt");

-- CreateIndex
CREATE INDEX "support_messages_ticketId_idx" ON "support_messages"("ticketId");

-- CreateIndex
CREATE INDEX "support_messages_userId_idx" ON "support_messages"("userId");

-- CreateIndex
CREATE INDEX "support_messages_createdAt_idx" ON "support_messages"("createdAt");

-- CreateIndex
CREATE INDEX "system_logs_level_idx" ON "system_logs"("level");

-- CreateIndex
CREATE INDEX "system_logs_category_idx" ON "system_logs"("category");

-- CreateIndex
CREATE INDEX "system_logs_event_idx" ON "system_logs"("event");

-- CreateIndex
CREATE INDEX "system_logs_actorUserId_idx" ON "system_logs"("actorUserId");

-- CreateIndex
CREATE INDEX "system_logs_createdAt_idx" ON "system_logs"("createdAt");

-- CreateIndex
CREATE INDEX "system_settings_updatedById_idx" ON "system_settings"("updatedById");

-- CreateIndex
CREATE UNIQUE INDEX "afip_configs_businessId_key" ON "afip_configs"("businessId");

-- CreateIndex
CREATE INDEX "afip_configs_businessId_idx" ON "afip_configs"("businessId");

-- CreateIndex
CREATE INDEX "points_of_sale_afipConfigId_idx" ON "points_of_sale"("afipConfigId");

-- CreateIndex
CREATE INDEX "points_of_sale_isActive_idx" ON "points_of_sale"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "points_of_sale_afipConfigId_number_key" ON "points_of_sale"("afipConfigId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "afip_invoices_saleId_key" ON "afip_invoices"("saleId");

-- CreateIndex
CREATE INDEX "afip_invoices_saleId_idx" ON "afip_invoices"("saleId");

-- CreateIndex
CREATE INDEX "afip_invoices_pointOfSaleId_idx" ON "afip_invoices"("pointOfSaleId");

-- CreateIndex
CREATE INDEX "afip_invoices_cae_idx" ON "afip_invoices"("cae");

-- CreateIndex
CREATE INDEX "afip_invoices_voucherType_idx" ON "afip_invoices"("voucherType");

-- CreateIndex
CREATE INDEX "afip_invoices_createdAt_idx" ON "afip_invoices"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "afip_invoices_pointOfSaleId_voucherType_voucherNumber_key" ON "afip_invoices"("pointOfSaleId", "voucherType", "voucherNumber");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions_ars" ADD CONSTRAINT "subscriptions_ars_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions_ars" ADD CONSTRAINT "subscriptions_ars_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_addons" ADD CONSTRAINT "subscription_addons_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "addons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_addons" ADD CONSTRAINT "subscription_addons_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions_ars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions_ars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_adjustments" ADD CONSTRAINT "price_adjustments_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "addons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_adjustments" ADD CONSTRAINT "price_adjustments_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_cashClosingId_fkey" FOREIGN KEY ("cashClosingId") REFERENCES "cash_closings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES "cash_registers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_items" ADD CONSTRAINT "refund_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_items" ADD CONSTRAINT "refund_items_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "refunds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_items" ADD CONSTRAINT "refund_items_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "sale_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_payments" ADD CONSTRAINT "client_payments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_payments" ADD CONSTRAINT "client_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_activity_logs" ADD CONSTRAINT "client_activity_logs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_activity_logs" ADD CONSTRAINT "client_activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES "cash_registers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_registers" ADD CONSTRAINT "cash_registers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_closings" ADD CONSTRAINT "cash_closings_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_closings" ADD CONSTRAINT "cash_closings_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_closings" ADD CONSTRAINT "cash_closings_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_stocks" ADD CONSTRAINT "variant_stocks_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_stocks" ADD CONSTRAINT "variant_stocks_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_block_logs" ADD CONSTRAINT "plan_block_logs_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_stocks" ADD CONSTRAINT "product_stocks_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_stocks" ADD CONSTRAINT "product_stocks_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_of_sale" ADD CONSTRAINT "points_of_sale_afipConfigId_fkey" FOREIGN KEY ("afipConfigId") REFERENCES "afip_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "afip_invoices" ADD CONSTRAINT "afip_invoices_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "points_of_sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
