-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('SCREENSHOT', 'PDF', 'DOCUMENT', 'REPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "EvidenceVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'AUTO_VERIFIED', 'VERIFICATION_FAILED');

-- CreateEnum
CREATE TYPE "VerificationMethod" AS ENUM ('AUTOMATIC', 'MANUAL');

-- CreateEnum
CREATE TYPE "EvidenceVerificationMode" AS ENUM ('AUTO_WITH_FALLBACK', 'AUTO_ONLY', 'MANUAL_ONLY');

-- AlterEnum: each ADD VALUE commits on its own (no explicit transaction wrapping this file),
-- so none of these are used elsewhere in this same migration.
ALTER TYPE "FindingActivityType" ADD VALUE 'AUTO_SCAN_STARTED';
ALTER TYPE "FindingActivityType" ADD VALUE 'AUTO_SCAN_COMPLETED';
ALTER TYPE "FindingActivityType" ADD VALUE 'SCAN_PASSED';
ALTER TYPE "FindingActivityType" ADD VALUE 'SCAN_FAILED';

-- AlterTable: Evidence gains name/type as nullable first, backfilled, then locked to NOT NULL
ALTER TABLE "Evidence" ADD COLUMN     "name" TEXT,
ADD COLUMN     "type" "EvidenceType",
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "reviewerId" TEXT,
ADD COLUMN     "verificationMethod" "VerificationMethod",
ADD COLUMN     "verificationStatus" "EvidenceVerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

UPDATE "Evidence" SET "name" = "fileName" WHERE "name" IS NULL;
UPDATE "Evidence" SET "type" = 'OTHER' WHERE "type" IS NULL;

-- Backfill: evidence already tied to a RESOLVED finding was, by definition, already manually
-- approved under the pre-existing Phase 4 workflow (that's the only way a finding could reach
-- RESOLVED before this migration) — reflect that real history instead of leaving it PENDING.
UPDATE "Evidence" e
SET "verificationStatus" = 'APPROVED', "verificationMethod" = 'MANUAL', "verifiedAt" = f."resolvedAt"
FROM "Finding" f
WHERE e."findingId" = f.id AND f.status = 'RESOLVED';

ALTER TABLE "Evidence" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "Evidence" ALTER COLUMN "type" SET NOT NULL;

-- AlterTable
ALTER TABLE "Finding" ADD COLUMN     "controlId" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "evidenceVerificationMode" "EvidenceVerificationMode" NOT NULL DEFAULT 'AUTO_WITH_FALLBACK';

-- AlterTable
ALTER TABLE "Scan" ADD COLUMN     "verifiesEvidenceId" TEXT,
ADD COLUMN     "verifiesFindingId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "evidenceVerificationMode" "EvidenceVerificationMode" NOT NULL DEFAULT 'AUTO_WITH_FALLBACK';

-- CreateTable
CREATE TABLE "Control" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "framework" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Control_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_verifiesFindingId_fkey" FOREIGN KEY ("verifiesFindingId") REFERENCES "Finding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_verifiesEvidenceId_fkey" FOREIGN KEY ("verifiesEvidenceId") REFERENCES "Evidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Control" ADD CONSTRAINT "Control_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Control" ADD CONSTRAINT "Control_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
