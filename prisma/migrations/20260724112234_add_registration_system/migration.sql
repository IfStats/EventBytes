/*
  Warnings:

  - The values [PENDING] on the enum `RegistrationStatus` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[qrCode]` on the table `Registration` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `qrCode` to the `Registration` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."RegistrationStatus_new" AS ENUM ('CONFIRMED', 'CHECKED_IN', 'CANCELLED');
ALTER TABLE "public"."Registration" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Registration" ALTER COLUMN "status" TYPE "public"."RegistrationStatus_new" USING ("status"::text::"public"."RegistrationStatus_new");
ALTER TYPE "public"."RegistrationStatus" RENAME TO "RegistrationStatus_old";
ALTER TYPE "public"."RegistrationStatus_new" RENAME TO "RegistrationStatus";
DROP TYPE "public"."RegistrationStatus_old";
ALTER TABLE "public"."Registration" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED';
COMMIT;

-- AlterTable
ALTER TABLE "public"."Registration" ADD COLUMN     "qrCode" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'CONFIRMED';

-- CreateIndex
CREATE UNIQUE INDEX "Registration_qrCode_key" ON "public"."Registration"("qrCode");
