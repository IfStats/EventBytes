-- CreateTable
CREATE TABLE "public"."Country" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "phoneCode" TEXT,
    "paymentProvider" "public"."PaymentProvider",

    CONSTRAINT "Country_pkey" PRIMARY KEY ("code")
);

-- Insert default countries
INSERT INTO "public"."Country"
(
    "code",
    "name",
    "currency",
    "symbol",
    "locale",
    "timezone",
    "phoneCode",
    "paymentProvider"
)
VALUES
(
    'NG',
    'Nigeria',
    'NGN',
    '₦',
    'en-NG',
    'Africa/Lagos',
    '+234',
    'PAYSTACK'
),
(
    'GH',
    'Ghana',
    'GHS',
    '₵',
    'en-GH',
    'Africa/Accra',
    '+233',
    'PAYSTACK'
);

-- AlterTable
ALTER TABLE "public"."Organization"
ADD COLUMN "countryCode" TEXT NOT NULL DEFAULT 'NG';

-- CreateIndex
CREATE INDEX "Organization_countryCode_idx"
ON "public"."Organization"("countryCode");

-- AddForeignKey
ALTER TABLE "public"."Organization"
ADD CONSTRAINT "Organization_countryCode_fkey"
FOREIGN KEY ("countryCode")
REFERENCES "public"."Country"("code")
ON DELETE RESTRICT
ON UPDATE CASCADE;