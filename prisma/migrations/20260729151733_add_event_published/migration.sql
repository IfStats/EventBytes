/*
  Warnings:

  - You are about to drop the column `checkedInAt` on the `Ticket` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Event" ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Ticket" DROP COLUMN "checkedInAt";
