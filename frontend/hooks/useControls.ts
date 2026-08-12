"use client";

import { useQuery } from "@tanstack/react-query";
import type { Control, ControlDetail } from "@/types";

async function fetchControls(): Promise<Control[]> {
  const res = await fetch("/api/controls");
  if (!res.ok) throw new Error("Failed to load controls");
  return res.json();
}

export function useControls() {
  return useQuery({ queryKey: ["controls"], queryFn: fetchControls });
}

async function fetchControl(id: string): Promise<ControlDetail> {
  const res = await fetch(`/api/controls/${id}`);
  if (!res.ok) throw new Error("Failed to load control");
  return res.json();
}

export function useControl(id: string | null) {
  return useQuery({
    queryKey: ["control", id],
    queryFn: () => fetchControl(id as string),
    enabled: id !== null,
  });
}
