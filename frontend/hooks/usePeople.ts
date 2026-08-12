"use client";

import { useQuery } from "@tanstack/react-query";
import type { Person, PersonDetail } from "@/types";

export interface PersonFilters {
  status?: string;
  department?: string;
  controlId?: string;
  assigneeId?: string;
  search?: string;
}

function buildQuery(filters: PersonFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

async function fetchPeople(filters: PersonFilters): Promise<Person[]> {
  const res = await fetch(`/api/people${buildQuery(filters)}`);
  if (!res.ok) throw new Error("Failed to load people");
  return res.json();
}

export function usePeople(filters: PersonFilters = {}) {
  return useQuery({
    queryKey: ["people", filters],
    queryFn: () => fetchPeople(filters),
  });
}

async function fetchPerson(id: string): Promise<PersonDetail> {
  const res = await fetch(`/api/people/${id}`);
  if (!res.ok) throw new Error("Failed to load person");
  return res.json();
}

export function usePerson(id: string | null) {
  return useQuery({
    queryKey: ["person", id],
    queryFn: () => fetchPerson(id as string),
    enabled: id !== null,
  });
}
