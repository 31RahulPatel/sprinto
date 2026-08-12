"use client";

import { useQuery } from "@tanstack/react-query";
import type { Integration } from "@/types";

async function fetchIntegrations(): Promise<Integration[]> {
  const res = await fetch("/api/integrations");
  if (!res.ok) throw new Error("Failed to load integrations");
  return res.json();
}

export function useIntegrations(refetchInterval: number | false = false) {
  return useQuery({ queryKey: ["integrations"], queryFn: fetchIntegrations, refetchInterval });
}
