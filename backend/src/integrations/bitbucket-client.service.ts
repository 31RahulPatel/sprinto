import { Injectable, InternalServerErrorException } from '@nestjs/common';

const AUTHORIZE_URL = 'https://bitbucket.org/site/oauth2/authorize';
const TOKEN_URL = 'https://bitbucket.org/site/oauth2/access_token';
const API_BASE = 'https://api.bitbucket.org/2.0';

export interface BitbucketTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface BitbucketWorkspace {
  slug: string;
  name: string;
}

export interface BitbucketRepo {
  slug: string;
  name: string;
  isPrivate: boolean;
  mainBranch: string | null;
}

export interface BitbucketBranchInfo {
  name: string;
}

export interface BitbucketBranchRestriction {
  kind: string;
  pattern: string;
  value: number | null;
}

export interface BitbucketWorkspaceMember {
  accountId: string;
  displayName: string;
  permission: string;
}

function credentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.BITBUCKET_CLIENT_ID;
  const clientSecret = process.env.BITBUCKET_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new InternalServerErrorException(
      'BITBUCKET_CLIENT_ID/BITBUCKET_CLIENT_SECRET are not configured',
    );
  }
  return { clientId, clientSecret };
}

async function paginate<T>(
  url: string,
  accessToken: string,
  mapItem: (raw: any) => T,
): Promise<T[]> {
  const results: T[] = [];
  let next: string | undefined = url;
  while (next) {
    const res: Awaited<ReturnType<typeof fetch>> = await fetch(next, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const body: string = await res.text();
      throw new Error(`Bitbucket API error ${res.status}: ${body.slice(0, 500)}`);
    }
    const data: { values?: any[]; next?: string } = await res.json();
    results.push(...(data.values ?? []).map(mapItem));
    next = data.next;
  }
  return results;
}

@Injectable()
export class BitbucketClientService {
  getAuthorizeUrl(state: string): string {
    const { clientId } = credentials();
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      state,
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<BitbucketTokens> {
    return this.requestToken({ grant_type: 'authorization_code', code });
  }

  async refreshToken(refreshToken: string): Promise<BitbucketTokens> {
    return this.requestToken({ grant_type: 'refresh_token', refresh_token: refreshToken });
  }

  private async requestToken(body: Record<string, string>): Promise<BitbucketTokens> {
    const { clientId, clientSecret } = credentials();
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(body).toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Bitbucket token endpoint error ${res.status}: ${text.slice(0, 500)}`);
    }

    const data = await res.json();
    const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
    return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresAt };
  }

  listWorkspaces(accessToken: string): Promise<BitbucketWorkspace[]> {
    return paginate(`${API_BASE}/workspaces`, accessToken, (raw) => ({
      slug: raw.slug,
      name: raw.name,
    }));
  }

  listRepositories(accessToken: string, workspaceSlug: string): Promise<BitbucketRepo[]> {
    return paginate(
      `${API_BASE}/repositories/${encodeURIComponent(workspaceSlug)}`,
      accessToken,
      (raw) => ({
        slug: raw.slug,
        name: raw.name,
        isPrivate: Boolean(raw.is_private),
        mainBranch: raw.mainbranch?.name ?? null,
      }),
    );
  }

  listBranches(
    accessToken: string,
    workspaceSlug: string,
    repoSlug: string,
  ): Promise<BitbucketBranchInfo[]> {
    return paginate(
      `${API_BASE}/repositories/${encodeURIComponent(workspaceSlug)}/${encodeURIComponent(repoSlug)}/refs/branches`,
      accessToken,
      (raw) => ({ name: raw.name }),
    );
  }

  getBranchRestrictions(
    accessToken: string,
    workspaceSlug: string,
    repoSlug: string,
  ): Promise<BitbucketBranchRestriction[]> {
    return paginate(
      `${API_BASE}/repositories/${encodeURIComponent(workspaceSlug)}/${encodeURIComponent(repoSlug)}/branch-restrictions`,
      accessToken,
      (raw) => ({ kind: raw.kind, pattern: raw.pattern, value: raw.value ?? null }),
    );
  }

  listWorkspacePermissions(
    accessToken: string,
    workspaceSlug: string,
  ): Promise<BitbucketWorkspaceMember[]> {
    return paginate(
      `${API_BASE}/workspaces/${encodeURIComponent(workspaceSlug)}/permissions`,
      accessToken,
      (raw) => ({
        accountId: raw.user.uuid,
        displayName: raw.user.display_name,
        permission: raw.permission,
      }),
    );
  }
}
