import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { BitbucketClientService } from './bitbucket-client.service';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { ownerWhere, ownerData } from '../common/ownership.util';
import { encrypt, decrypt } from '../common/crypto.util';
import { BitbucketCallbackDto } from './dto/bitbucket-callback.dto';
import { SelectWorkspaceDto } from './dto/select-workspace.dto';
import { ToggleRepoSelectionDto } from './dto/toggle-repo-selection.dto';
import type { BitbucketTokens } from './bitbucket-client.service';

const STATE_TTL_MS = 10 * 60 * 1000;

function signState(userId: string): string {
  const payload = { userId, exp: Date.now() + STATE_TTL_MS };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', process.env.ENCRYPTION_KEY ?? '')
    .update(payloadB64)
    .digest('hex');
  return `${payloadB64}.${signature}`;
}

function verifyState(state: string): string {
  const [payloadB64, signature] = state.split('.');
  if (!payloadB64 || !signature) {
    throw new BadRequestException('Invalid OAuth state');
  }
  const expected = createHmac('sha256', process.env.ENCRYPTION_KEY ?? '')
    .update(payloadB64)
    .digest('hex');
  if (
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    throw new BadRequestException('Invalid OAuth state signature');
  }
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
  if (payload.exp < Date.now()) {
    throw new BadRequestException('OAuth state expired — please try connecting again');
  }
  return payload.userId;
}

const integrationSelect = {
  id: true,
  provider: true,
  status: true,
  workspaceSlug: true,
  workspaceName: true,
  errorMessage: true,
  lastSyncedAt: true,
  createdAt: true,
  _count: { select: { repositories: true } },
} as const;

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitbucket: BitbucketClientService,
    @InjectQueue('bitbucket-sync') private readonly syncQueue: Queue,
  ) {}

  findAll(user: AuthenticatedUser) {
    return this.prisma.integration.findMany({
      where: ownerWhere(user),
      select: integrationSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string, user: AuthenticatedUser) {
    const integration = await this.prisma.integration.findFirst({
      where: { id, ...ownerWhere(user) },
    });
    if (!integration) {
      throw new NotFoundException('Integration not found');
    }
    await this.prisma.integration.delete({ where: { id } });
  }

  getAuthorizeUrl(user: AuthenticatedUser) {
    const state = signState(user.id);
    return { url: this.bitbucket.getAuthorizeUrl(state) };
  }

  async handleCallback(dto: BitbucketCallbackDto, user: AuthenticatedUser) {
    const stateUserId = verifyState(dto.state);
    if (stateUserId !== user.id) {
      throw new BadRequestException('OAuth state does not match the current session');
    }

    const tokens = await this.bitbucket.exchangeCode(dto.code);

    const integration = await this.prisma.integration.create({
      data: {
        provider: 'BITBUCKET',
        status: 'CONNECTED',
        tokensEncrypted: encrypt(JSON.stringify(tokens)),
        ...ownerData(user),
      },
      select: integrationSelect,
    });

    return integration;
  }

  private async findOwned(id: string, user: AuthenticatedUser) {
    const integration = await this.prisma.integration.findFirst({
      where: { id, ...ownerWhere(user) },
    });
    if (!integration) {
      throw new NotFoundException('Integration not found');
    }
    return integration;
  }

  async getValidAccessToken(id: string, user: AuthenticatedUser): Promise<string> {
    const integration = await this.findOwned(id, user);
    return this.refreshIfNeeded(integration.id, integration.tokensEncrypted);
  }

  // Public: also called directly by BitbucketSyncProcessor, which operates on a trusted
  // integrationId from a queued job rather than an ownership-checked request.
  async refreshIfNeeded(integrationId: string, tokensEncrypted: string): Promise<string> {
    const tokens: BitbucketTokens = JSON.parse(decrypt(tokensEncrypted));
    if (new Date(tokens.expiresAt).getTime() > Date.now() + 60_000) {
      return tokens.accessToken;
    }
    const refreshed = await this.bitbucket.refreshToken(tokens.refreshToken);
    await this.prisma.integration.update({
      where: { id: integrationId },
      data: { tokensEncrypted: encrypt(JSON.stringify(refreshed)) },
    });
    return refreshed.accessToken;
  }

  async listWorkspaces(id: string, user: AuthenticatedUser) {
    const accessToken = await this.getValidAccessToken(id, user);
    return this.bitbucket.listWorkspaces(accessToken);
  }

  async selectWorkspace(id: string, dto: SelectWorkspaceDto, user: AuthenticatedUser) {
    await this.findOwned(id, user);
    return this.prisma.integration.update({
      where: { id },
      data: { workspaceSlug: dto.workspaceSlug, workspaceName: dto.workspaceName },
      select: integrationSelect,
    });
  }

  async listLiveRepositories(id: string, user: AuthenticatedUser) {
    const integration = await this.findOwned(id, user);
    if (!integration.workspaceSlug) {
      throw new BadRequestException('Select a workspace first');
    }
    const accessToken = await this.refreshIfNeeded(integration.id, integration.tokensEncrypted);
    const repos = await this.bitbucket.listRepositories(accessToken, integration.workspaceSlug);

    const results = [];
    for (const repo of repos) {
      const row = await this.prisma.bitbucketRepository.upsert({
        where: { integrationId_slug: { integrationId: id, slug: repo.slug } },
        update: { name: repo.name, isPrivate: repo.isPrivate, mainBranch: repo.mainBranch },
        create: {
          integrationId: id,
          slug: repo.slug,
          name: repo.name,
          isPrivate: repo.isPrivate,
          mainBranch: repo.mainBranch,
        },
        select: { slug: true, name: true, isPrivate: true, selectedForScan: true },
      });
      results.push(row);
    }
    return results;
  }

  async toggleRepositorySelection(
    id: string,
    repoSlug: string,
    dto: ToggleRepoSelectionDto,
    user: AuthenticatedUser,
  ) {
    await this.findOwned(id, user);
    const repo = await this.prisma.bitbucketRepository.findFirst({
      where: { integrationId: id, slug: repoSlug },
    });
    if (!repo) {
      throw new NotFoundException('Repository not found — list live repositories first');
    }
    return this.prisma.bitbucketRepository.update({
      where: { id: repo.id },
      data: { selectedForScan: dto.selected },
      select: { slug: true, name: true, isPrivate: true, selectedForScan: true },
    });
  }

  async getSyncedRepositories(id: string, user: AuthenticatedUser) {
    await this.findOwned(id, user);
    return this.prisma.bitbucketRepository.findMany({
      where: { integrationId: id, selectedForScan: true },
      select: {
        id: true,
        slug: true,
        name: true,
        isPrivate: true,
        mainBranch: true,
        updatedAt: true,
        branches: {
          select: {
            id: true,
            name: true,
            isMainBranch: true,
            requiresApprovals: true,
            minApprovals: true,
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getMembers(id: string, user: AuthenticatedUser) {
    await this.findOwned(id, user);
    return this.prisma.integrationMember.findMany({
      where: { integrationId: id },
      select: { accountId: true, displayName: true, permission: true },
      orderBy: { displayName: 'asc' },
    });
  }

  async triggerSync(id: string, user: AuthenticatedUser) {
    const integration = await this.findOwned(id, user);
    if (!integration.workspaceSlug) {
      throw new BadRequestException('Select a workspace before syncing');
    }
    const sync = await this.prisma.integrationSync.create({
      data: { integrationId: id, status: 'QUEUED' },
    });
    await this.syncQueue.add('run-sync', { integrationId: id, syncId: sync.id });
    return sync;
  }
}
