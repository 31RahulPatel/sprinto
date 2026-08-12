"use client";

import { useQuery } from "@tanstack/react-query";
import type { EvidenceVerificationMode } from "@/types";

async function fetchMode(): Promise<{ mode: EvidenceVerificationMode }> {
  const res = await fetch("/api/settings/evidence-verification");
  if (!res.ok) throw new Error("Failed to load evidence verification setting");
  return res.json();
}

export function useEvidenceVerificationMode(enabled: boolean) {
  return useQuery({ queryKey: ["evidence-verification-mode"], queryFn: fetchMode, enabled });
}
