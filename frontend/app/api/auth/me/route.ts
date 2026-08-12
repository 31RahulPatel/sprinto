import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendUrl, SESSION_COOKIE } from "@/lib/session";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const backendRes = await fetch(backendUrl("/auth/me"), {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await backendRes.json();
  return NextResponse.json(data, { status: backendRes.status });
}
