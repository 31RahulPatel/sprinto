import { cookies } from "next/headers";
import { backendUrl, SESSION_COOKIE } from "@/lib/session";

export async function backendFetch(path: string, init?: RequestInit) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  return fetch(backendUrl(path), {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
