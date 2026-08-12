"use client";

import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "./useCurrentUser";
import type { Finding } from "@/types";

const ACTIONABLE_STATUSES: Finding["status"][] = ["ASSIGNED", "IN_PROGRESS"];

async function fetchAssignedFindings(userId: string): Promise<Finding[]> {
  const res = await fetch(`/api/findings?assigneeId=${userId}`);
  if (!res.ok) throw new Error("Failed to load assigned tasks");
  return res.json();
}

export function useAssignedTasks() {
  const { data: currentUser } = useCurrentUser();
  const query = useQuery({
    queryKey: ["findings", "assignedToMe", currentUser?.id],
    queryFn: () => fetchAssignedFindings(currentUser!.id),
    enabled: !!currentUser?.id,
  });

  const pendingCount =
    query.data?.filter((task) => ACTIONABLE_STATUSES.includes(task.status)).length ?? 0;

  return { ...query, pendingCount };
}
