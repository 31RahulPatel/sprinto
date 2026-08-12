"use client";

import { useQuery } from "@tanstack/react-query";
import type { Policy } from "@/types";

async function fetchPolicies(): Promise<Policy[]> {
  const res = await fetch("/api/policies");
  if (!res.ok) throw new Error("Failed to load policies");
  return res.json();
}

export function usePolicies() {
  return useQuery({ queryKey: ["policies"], queryFn: fetchPolicies });
}
