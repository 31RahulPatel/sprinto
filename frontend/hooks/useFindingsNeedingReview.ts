"use client";

import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "./useCurrentUser";
import { canReview } from "@/lib/permissions";
import type { Finding } from "@/types";

const REVIEW_STATUSES = ["EVIDENCE_SUBMITTED", "UNDER_REVIEW"] as const;

async function fetchFindingsByStatus(status: string): Promise<Finding[]> {
  const res = await fetch(`/api/findings?status=${status}`);
  if (!res.ok) throw new Error("Failed to load findings needing review");
  return res.json();
}

// Org-wide, not scoped to the current admin — mirrors useTasksNeedingReview.
export function useFindingsNeedingReview() {
  const { data: currentUser } = useCurrentUser();
  const enabled = canReview(currentUser);
  const query = useQuery({
    queryKey: ["findings", "needsReview"],
    queryFn: async () => {
      const results = await Promise.all(REVIEW_STATUSES.map(fetchFindingsByStatus));
      return results.flat();
    },
    enabled,
  });

  return { ...query, pendingCount: enabled ? query.data?.length ?? 0 : 0 };
}
