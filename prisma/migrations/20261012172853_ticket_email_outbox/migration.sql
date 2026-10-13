-- CreateEnum
CREATE TYPE "TicketEmailStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "TicketEmailOutbox" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "status" "TicketEmailStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseUntil" TIMESTAMP(3),
    "providerEmailId" TEXT,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketEmailOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TicketEmailOutbox_ticketId_key" ON "TicketEmailOutbox"("ticketId");

-- CreateIndex
CREATE INDEX "TicketEmailOutbox_status_nextAttemptAt_idx" ON "TicketEmailOutbox"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "TicketEmailOutbox_leaseUntil_idx" ON "TicketEmailOutbox"("leaseUntil");

-- AddForeignKey
ALTER TABLE "TicketEmailOutbox" ADD CONSTRAINT "TicketEmailOutbox_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
