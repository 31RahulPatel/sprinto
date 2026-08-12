-- CreateEnum
CREATE TYPE "StaffDeviceStatus" AS ENUM ('PENDING', 'COMPLIANT');

-- CreateTable
CREATE TABLE "StaffDevice" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT,
    "ownerId" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "os" TEXT NOT NULL,
    "osVersion" TEXT,
    "status" "StaffDeviceStatus" NOT NULL DEFAULT 'PENDING',
    "controlId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffDevice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffDevice_ownerId_key" ON "StaffDevice"("ownerId");

-- CreateIndex
CREATE INDEX "StaffDevice_organizationId_idx" ON "StaffDevice"("organizationId");

-- CreateIndex
CREATE INDEX "StaffDevice_userId_idx" ON "StaffDevice"("userId");

-- CreateIndex
CREATE INDEX "StaffDevice_controlId_idx" ON "StaffDevice"("controlId");

-- AddForeignKey
ALTER TABLE "StaffDevice" ADD CONSTRAINT "StaffDevice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffDevice" ADD CONSTRAINT "StaffDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffDevice" ADD CONSTRAINT "StaffDevice_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffDevice" ADD CONSTRAINT "StaffDevice_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control"("id") ON DELETE SET NULL ON UPDATE CASCADE;
