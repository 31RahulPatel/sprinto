"use client";

import { useQuery } from "@tanstack/react-query";
import type { FindingDetail } from "@/types";

async function fetchFinding(id: string): Promise<FindingDetail> {
  const res = await fetch(`/api/findings/${id}`);
  if (!res.ok) throw new Error("Failed to load finding");
  return res.json();
}

export function useFinding(id: string | null) {
  return useQuery({
    queryKey: ["finding", id],
    queryFn: () => fetchFinding(id as string),
    enabled: id !== null,
  });
}
