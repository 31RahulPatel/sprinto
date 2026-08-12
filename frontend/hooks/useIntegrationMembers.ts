"use client";

import { useQuery } from "@tanstack/react-query";
import type { IntegrationMember } from "@/types";

async function fetchMembers(integrationId: string): Promise<IntegrationMember[]> {
  const res = await fetch(`/api/integrations/${integrationId}/members`);
  if (!res.ok) throw new Error("Failed to load workspace members");
  return res.json();
}

export function useIntegrationMembers(integrationId: string | null) {
  return useQuery({
    queryKey: ["integration-members", integrationId],
    queryFn: () => fetchMembers(integrationId as string),
    enabled: integrationId !== null,
  });
}
