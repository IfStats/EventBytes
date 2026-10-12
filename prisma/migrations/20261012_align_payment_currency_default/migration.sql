
-- Remove the legacy Ghana-specific currency default.
-- Payment currency is determined by the organizer's country configuration.

ALTER TABLE "public"."Payment"
ALTER COLUMN "currency" DROP DEFAULT;
