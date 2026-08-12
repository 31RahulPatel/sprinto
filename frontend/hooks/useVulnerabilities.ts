"use client";

import { useQuery } from "@tanstack/react-query";
import type { Vulnerability, VulnerabilityDetail } from "@/types";

export interface VulnerabilityFilters {
  severity?: string;
  status?: string;
  controlId?: string;
  assigneeId?: string;
  search?: string;
}

function buildQuery(filters: VulnerabilityFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

async function fetchVulnerabilities(filters: VulnerabilityFilters): Promise<Vulnerability[]> {
  const res = await fetch(`/api/vulnerabilities${buildQuery(filters)}`);
  if (!res.ok) throw new Error("Failed to load vulnerabilities");
  return res.json();
}

export function useVulnerabilities(filters: VulnerabilityFilters = {}) {
  return useQuery({
    queryKey: ["vulnerabilities", filters],
    queryFn: () => fetchVulnerabilities(filters),
  });
}

async function fetchVulnerability(id: string): Promise<VulnerabilityDetail> {
  const res = await fetch(`/api/vulnerabilities/${id}`);
  if (!res.ok) throw new Error("Failed to load vulnerability");
  return res.json();
}

export function useVulnerability(id: string | null) {
  return useQuery({
    queryKey: ["vulnerability", id],
    queryFn: () => fetchVulnerability(id as string),
    enabled: id !== null,
  });
}
