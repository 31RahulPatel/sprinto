-- DropForeignKey
ALTER TABLE "Finding" DROP CONSTRAINT "Finding_scanId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_scanId_fkey";

-- DropForeignKey
ALTER TABLE "Scan" DROP CONSTRAINT "Scan_cloudAccountId_fkey";

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_cloudAccountId_fkey" FOREIGN KEY ("cloudAccountId") REFERENCES "CloudAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
