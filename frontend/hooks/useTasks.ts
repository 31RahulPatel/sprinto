"use client";

import { useQuery } from "@tanstack/react-query";
import type { Task, TaskDetail } from "@/types";

export interface TaskFilters {
  status?: string;
  assigneeId?: string;
  entityType?: string;
  entityId?: string;
  controlId?: string;
  search?: string;
}

function buildQuery(filters: TaskFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

async function fetchTasks(filters: TaskFilters): Promise<Task[]> {
  const res = await fetch(`/api/tasks${buildQuery(filters)}`);
  if (!res.ok) throw new Error("Failed to load tasks");
  return res.json();
}

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: () => fetchTasks(filters),
  });
}

async function fetchTask(id: string): Promise<TaskDetail> {
  const res = await fetch(`/api/tasks/${id}`);
  if (!res.ok) throw new Error("Failed to load task");
  return res.json();
}

export function useTask(id: string | null) {
  return useQuery({
    queryKey: ["task", id],
    queryFn: () => fetchTask(id as string),
    enabled: id !== null,
  });
}

export function useEntityTasks(entityType: string, entityId: string | null) {
  return useQuery({
    queryKey: ["tasks", { entityType, entityId }],
    queryFn: () => fetchTasks({ entityType, entityId: entityId as string }),
    enabled: entityId !== null,
  });
}
