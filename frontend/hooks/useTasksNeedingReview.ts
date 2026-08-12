"use client";

import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "./useCurrentUser";
import { canReviewTask } from "@/lib/permissions";
import type { Task } from "@/types";

const REVIEW_STATUSES = ["EVIDENCE_SUBMITTED", "UNDER_REVIEW"] as const;

async function fetchTasksByStatus(status: string): Promise<Task[]> {
  const res = await fetch(`/api/tasks?status=${status}`);
  if (!res.ok) throw new Error("Failed to load tasks needing review");
  return res.json();
}

// Org-wide, not scoped to the current admin — any admin/super admin can pick up any
// submitted task (see backend tasks.service.ts devScope, which only restricts DEV callers).
export function useTasksNeedingReview() {
  const { data: currentUser } = useCurrentUser();
  const enabled = canReviewTask(currentUser);
  const query = useQuery({
    queryKey: ["tasks", "needsReview"],
    queryFn: async () => {
      const results = await Promise.all(REVIEW_STATUSES.map(fetchTasksByStatus));
      return results.flat();
    },
    enabled,
  });

  return { ...query, pendingCount: enabled ? query.data?.length ?? 0 : 0 };
}
