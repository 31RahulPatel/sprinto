"use client";

import { useQuery } from "@tanstack/react-query";
import type { User } from "@/types";

async function fetchCurrentUser(): Promise<User | null> {
  const res = await fetch("/api/auth/me");
  if (!res.ok) {
    return null;
  }
  return res.json();
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchCurrentUser,
    retry: false,
  });
}
