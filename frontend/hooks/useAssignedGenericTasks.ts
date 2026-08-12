"use client";

import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "./useCurrentUser";
import type { Task } from "@/types";

const ACTIONABLE_STATUSES: Task["status"][] = ["ASSIGNED", "IN_PROGRESS"];

async function fetchAssignedTasks(userId: string): Promise<Task[]> {
  const res = await fetch(`/api/tasks?assigneeId=${userId}`);
  if (!res.ok) throw new Error("Failed to load assigned tasks");
  return res.json();
}

export function useAssignedGenericTasks() {
  const { data: currentUser } = useCurrentUser();
  const query = useQuery({
    queryKey: ["tasks", "assignedToMe", currentUser?.id],
    queryFn: () => fetchAssignedTasks(currentUser!.id),
    enabled: !!currentUser?.id,
  });

  const pendingCount =
    query.data?.filter((task) => ACTIONABLE_STATUSES.includes(task.status)).length ?? 0;

  return { ...query, pendingCount };
}
