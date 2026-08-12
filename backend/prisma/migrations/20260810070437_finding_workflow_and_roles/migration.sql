-- CreateEnum
CREATE TYPE "FindingStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'EVIDENCE_SUBMITTED', 'UNDER_REVIEW', 'RESOLVED');

-- CreateEnum
CREATE TYPE "FindingActivityType" AS ENUM ('ASSIGNED', 'REASSIGNED', 'STATUS_CHANGED', 'EVIDENCE_UPLOADED', 'REVIEW_APPROVED', 'REVIEW_REJECTED');

-- AlterEnum: Role gains REVIEWER/CONTRIBUTOR, loses USER (remapped to CONTRIBUTOR)
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'REVIEWER', 'CONTRIBUTOR', 'VIEWER');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING (
  CASE "role"::text WHEN 'USER' THEN 'CONTRIBUTOR' ELSE "role"::text END
)::"Role_new";
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'CONTRIBUTOR';
COMMIT;

-- AlterTable: Finding gains assignment/review fields; status becomes a real enum (cast, not drop+recreate)
ALTER TABLE "Finding" ADD COLUMN     "assignedAt" TIMESTAMP(3),
ADD COLUMN     "assignedById" TEXT,
ADD COLUMN     "assigneeId" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "resolvedAt" TIMESTAMP(3);

ALTER TABLE "Finding" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Finding" ALTER COLUMN "status" TYPE "FindingStatus" USING ("status"::"FindingStatus");
ALTER TABLE "Finding" ALTER COLUMN "status" SET DEFAULT 'OPEN';

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FindingActivity" (
    "id" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "type" "FindingActivityType" NOT NULL,
    "fromStatus" "FindingStatus",
    "toStatus" "FindingStatus",
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FindingActivity_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "Finding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FindingActivity" ADD CONSTRAINT "FindingActivity_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "Finding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FindingActivity" ADD CONSTRAINT "FindingActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
