"use client";

import { useQuery } from "@tanstack/react-query";
import type { BitbucketWorkspace } from "@/types";

async function fetchWorkspaces(integrationId: string): Promise<BitbucketWorkspace[]> {
  const res = await fetch(`/api/integrations/${integrationId}/workspaces`);
  if (!res.ok) throw new Error("Failed to load Bitbucket workspaces");
  return res.json();
}

export function useBitbucketWorkspaces(integrationId: string | null) {
  return useQuery({
    queryKey: ["bitbucket-workspaces", integrationId],
    queryFn: () => fetchWorkspaces(integrationId as string),
    enabled: integrationId !== null,
  });
}
