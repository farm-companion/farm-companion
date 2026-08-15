-- Venue classification (2026-08-15). FSA's "Farmers/growers" category
-- identifies producers, not premises the public can enter, so venue type is
-- tracked separately and defaults to unknown (NULL). Both columns are
-- nullable: this migration adds the fields only, later work backfills them.

-- AlterTable
ALTER TABLE "farms" ADD COLUMN     "venueType" VARCHAR(32),
ADD COLUMN     "venueVerifiedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "farms_venueType_idx" ON "farms"("venueType");
