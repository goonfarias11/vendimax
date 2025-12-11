-- AlterTable
ALTER TABLE "subscriptions_ars" ADD COLUMN     "freeTrial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "planTier" "PlanTier",
ADD COLUMN     "trialEndsAt" TIMESTAMP(3);
