/*
  Warnings:

  - The values [ACTIVE] on the enum `TicketStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `qrCode` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `ticketNumber` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Ticket` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[ticketCode]` on the table `Ticket` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ticketCode` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."TicketStatus_new" AS ENUM ('VALID', 'USED', 'CANCELLED');
ALTER TABLE "public"."Ticket" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Ticket" ALTER COLUMN "status" TYPE "public"."TicketStatus_new" USING ("status"::text::"public"."TicketStatus_new");
ALTER TYPE "public"."TicketStatus" RENAME TO "TicketStatus_old";
ALTER TYPE "public"."TicketStatus_new" RENAME TO "TicketStatus";
DROP TYPE "public"."TicketStatus_old";
ALTER TABLE "public"."Ticket" ALTER COLUMN "status" SET DEFAULT 'VALID';
COMMIT;

-- DropIndex
DROP INDEX "public"."Ticket_ticketNumber_key";

-- AlterTable
ALTER TABLE "public"."Ticket" DROP COLUMN "qrCode",
DROP COLUMN "ticketNumber",
DROP COLUMN "updatedAt",
ADD COLUMN     "checkedInAt" TIMESTAMP(3),
ADD COLUMN     "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "ticketCode" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'VALID';

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_ticketCode_key" ON "public"."Ticket"("ticketCode");
