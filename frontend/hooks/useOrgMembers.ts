"use client";

import { useQuery } from "@tanstack/react-query";
import type { OrgMember } from "@/types";

async function fetchOrgMembers(): Promise<OrgMember[]> {
  const res = await fetch("/api/users");
  if (!res.ok) throw new Error("Failed to load team members");
  return res.json();
}

export function useOrgMembers(enabled: boolean) {
  return useQuery({ queryKey: ["org-members"], queryFn: fetchOrgMembers, enabled });
}
