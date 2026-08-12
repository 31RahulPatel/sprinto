-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('BITBUCKET');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT,
    "provider" "IntegrationProvider" NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'CONNECTED',
    "workspaceSlug" TEXT,
    "workspaceName" TEXT,
    "tokensEncrypted" TEXT NOT NULL,
    "errorMessage" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BitbucketRepository" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "mainBranch" TEXT,
    "selectedForScan" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BitbucketRepository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BitbucketBranch" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isMainBranch" BOOLEAN NOT NULL DEFAULT false,
    "requiresApprovals" BOOLEAN NOT NULL DEFAULT false,
    "minApprovals" INTEGER,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BitbucketBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationMember" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationSync" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'QUEUED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "repoCount" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationSync_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BitbucketRepository_integrationId_slug_key" ON "BitbucketRepository"("integrationId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "BitbucketBranch_repositoryId_name_key" ON "BitbucketBranch"("repositoryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationMember_integrationId_accountId_key" ON "IntegrationMember"("integrationId", "accountId");

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BitbucketRepository" ADD CONSTRAINT "BitbucketRepository_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BitbucketBranch" ADD CONSTRAINT "BitbucketBranch_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "BitbucketRepository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationMember" ADD CONSTRAINT "IntegrationMember_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationSync" ADD CONSTRAINT "IntegrationSync_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

