"use client";

import { useQuery } from "@tanstack/react-query";
import type { Training } from "@/types";

async function fetchTrainings(): Promise<Training[]> {
  const res = await fetch("/api/trainings");
  if (!res.ok) throw new Error("Failed to load trainings");
  return res.json();
}

export function useTrainings() {
  return useQuery({ queryKey: ["trainings"], queryFn: fetchTrainings });
}
