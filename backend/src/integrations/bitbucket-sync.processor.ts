import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationsService } from './integrations.service';
import { BitbucketClientService } from './bitbucket-client.service';
import type { BitbucketBranchRestriction } from './bitbucket-client.service';

function matchesPattern(pattern: string, branchName: string): boolean {
  if (pattern === branchName || pattern === '*' || pattern === '**') {
    return true;
  }
  const regex = new RegExp(`^${pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);
  return regex.test(branchName);
}

@Processor('bitbucket-sync')
export class BitbucketSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(BitbucketSyncProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly integrationsService: IntegrationsService,
    private readonly bitbucket: BitbucketClientService,
  ) {
    super();
  }

  async process(job: Job<{ integrationId: string; syncId: string }>): Promise<void> {
    const { integrationId, syncId } = job.data;

    const integration = await this.prisma.integration.findUniqueOrThrow({
      where: { id: integrationId },
    });

    await this.prisma.integrationSync.update({
      where: { id: syncId },
      data: { status: 'RUNNING', startedAt: new Date() },
    });

    try {
      if (!integration.workspaceSlug) {
        throw new Error('No workspace selected for this integration');
      }
      const accessToken = await this.integrationsService.refreshIfNeeded(
        integration.id,
        integration.tokensEncrypted,
      );

      const repos = await this.prisma.bitbucketRepository.findMany({
        where: { integrationId, selectedForScan: true },
      });

      for (const repo of repos) {
        const [branches, restrictions] = await Promise.all([
          this.bitbucket.listBranches(accessToken, integration.workspaceSlug, repo.slug),
          this.bitbucket.getBranchRestrictions(accessToken, integration.workspaceSlug, repo.slug),
        ]);

        const approvalRestrictions = restrictions.filter(
          (r: BitbucketBranchRestriction) => r.kind === 'require_approvals_to_merge',
        );

        await this.prisma.bitbucketBranch.deleteMany({ where: { repositoryId: repo.id } });
        if (branches.length > 0) {
          await this.prisma.bitbucketBranch.createMany({
            data: branches.map((branch) => {
              const matching = approvalRestrictions.find((r) =>
                matchesPattern(r.pattern, branch.name),
              );
              return {
                repositoryId: repo.id,
                name: branch.name,
                isMainBranch: branch.name === repo.mainBranch,
                requiresApprovals: Boolean(matching),
                minApprovals: matching?.value ?? null,
              };
            }),
          });
        }
      }

      const members = await this.bitbucket.listWorkspacePermissions(
        accessToken,
        integration.workspaceSlug,
      );
      await this.prisma.integrationMember.deleteMany({ where: { integrationId } });
      if (members.length > 0) {
        await this.prisma.integrationMember.createMany({
          data: members.map((m) => ({
            integrationId,
            accountId: m.accountId,
            displayName: m.displayName,
            permission: m.permission,
          })),
        });
      }

      await this.prisma.integrationSync.update({
        where: { id: syncId },
        data: { status: 'COMPLETED', completedAt: new Date(), repoCount: repos.length },
      });
      await this.prisma.integration.update({
        where: { id: integrationId },
        data: { status: 'CONNECTED', lastSyncedAt: new Date(), errorMessage: null },
      });

      this.logger.log(`Bitbucket sync ${syncId} completed for ${repos.length} repo(s).`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Bitbucket sync ${syncId} failed: ${message}`);
      await this.prisma.integrationSync.update({
        where: { id: syncId },
        data: { status: 'FAILED', completedAt: new Date(), errorMessage: message.slice(0, 2000) },
      });
      await this.prisma.integration.update({
        where: { id: integrationId },
        data: { status: 'ERROR', errorMessage: message.slice(0, 2000) },
      });
    }
  }
}
