-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "reservationExpiresAt" TIMESTAMP(3),
ADD COLUMN     "reservationReleasedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Registration_status_reservationExpiresAt_idx" ON "Registration"("status", "reservationExpiresAt");
