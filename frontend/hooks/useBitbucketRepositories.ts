"use client";

import { useQuery } from "@tanstack/react-query";
import type { BitbucketRepositoryLive, BitbucketRepositorySynced } from "@/types";

async function fetchLiveRepositories(integrationId: string): Promise<BitbucketRepositoryLive[]> {
  const res = await fetch(`/api/integrations/${integrationId}/repositories`);
  if (!res.ok) throw new Error("Failed to load repositories from Bitbucket");
  return res.json();
}

export function useBitbucketRepositories(integrationId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["bitbucket-repositories", integrationId],
    queryFn: () => fetchLiveRepositories(integrationId as string),
    enabled: enabled && integrationId !== null,
  });
}

async function fetchSyncedRepositories(integrationId: string): Promise<BitbucketRepositorySynced[]> {
  const res = await fetch(`/api/integrations/${integrationId}/repositories/synced`);
  if (!res.ok) throw new Error("Failed to load synced repositories");
  return res.json();
}

export function useSyncedRepositories(integrationId: string | null) {
  return useQuery({
    queryKey: ["bitbucket-synced-repositories", integrationId],
    queryFn: () => fetchSyncedRepositories(integrationId as string),
    enabled: integrationId !== null,
  });
}
