/*
  Warnings:

  - Added the required column `provider` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."PaymentProvider" AS ENUM ('PAYSTACK', 'FLUTTERWAVE', 'STRIPE');

-- AlterTable
ALTER TABLE "public"."Payment" DROP COLUMN "provider",
ADD COLUMN     "provider" "public"."PaymentProvider" NOT NULL;
