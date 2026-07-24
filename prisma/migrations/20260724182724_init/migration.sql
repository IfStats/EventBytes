/*
  Warnings:

  - You are about to drop the column `providerRef` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `ticketTypeId` on the `Registration` table. All the data in the column will be lost.
  - You are about to drop the column `ticketCode` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the `TicketType` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Event` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ticketNumber]` on the table `Ticket` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[qrToken]` on the table `Ticket` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ticketCategoryId` to the `Registration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `qrToken` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ticketNumber` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Registration" DROP CONSTRAINT "Registration_ticketTypeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TicketType" DROP CONSTRAINT "TicketType_eventId_fkey";

-- DropIndex
DROP INDEX "public"."Ticket_ticketCode_key";

-- AlterTable
ALTER TABLE "public"."AuditLog" ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "public"."Event" ADD COLUMN     "bannerImage" TEXT,
ADD COLUMN     "capacity" INTEGER,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Africa/Accra';

-- AlterTable
ALTER TABLE "public"."Organization" ADD COLUMN     "description" TEXT,
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "public"."Payment" DROP COLUMN "providerRef",
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "providerReference" TEXT;

-- AlterTable
ALTER TABLE "public"."Registration" DROP COLUMN "ticketTypeId",
ADD COLUMN     "checkedIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "checkedInAt" TIMESTAMP(3),
ADD COLUMN     "checkedInBy" TEXT,
ADD COLUMN     "ticketCategoryId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Ticket" DROP COLUMN "ticketCode",
ADD COLUMN     "qrToken" TEXT NOT NULL,
ADD COLUMN     "ticketNumber" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."TicketType";

-- CreateTable
CREATE TABLE "public"."TicketCategory" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "sold" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "public"."Event"("slug");

-- CreateIndex
CREATE INDEX "Payment_registrationId_idx" ON "public"."Payment"("registrationId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "public"."Payment"("status");

-- CreateIndex
CREATE INDEX "Registration_eventId_idx" ON "public"."Registration"("eventId");

-- CreateIndex
CREATE INDEX "Registration_userId_idx" ON "public"."Registration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_ticketNumber_key" ON "public"."Ticket"("ticketNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_qrToken_key" ON "public"."Ticket"("qrToken");

-- AddForeignKey
ALTER TABLE "public"."TicketCategory" ADD CONSTRAINT "TicketCategory_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Registration" ADD CONSTRAINT "Registration_ticketCategoryId_fkey" FOREIGN KEY ("ticketCategoryId") REFERENCES "public"."TicketCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
