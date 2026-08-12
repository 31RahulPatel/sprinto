-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "managerId" TEXT;

-- CreateIndex
CREATE INDEX "Person_managerId_idx" ON "Person"("managerId");

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
