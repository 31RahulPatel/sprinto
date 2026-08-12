"use client";

import { useQuery } from "@tanstack/react-query";
import type { CloudAccount } from "@/types";

async function fetchCloudAccounts(): Promise<CloudAccount[]> {
  const res = await fetch("/api/cloud-accounts");
  if (!res.ok) throw new Error("Failed to load cloud accounts");
  return res.json();
}

export function useCloudAccounts() {
  return useQuery({ queryKey: ["cloud-accounts"], queryFn: fetchCloudAccounts });
}

export function accountLabel(account: { accountId: string; displayName: string | null }): string {
  return account.displayName?.trim() || account.accountId;
}
