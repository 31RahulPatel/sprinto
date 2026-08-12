import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendUrl, isSecureRequest, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json();
  // confirmPassword is a client-only field; the backend's ValidationPipe rejects unknown properties.
  const { name, email, password, organizationName } = body;

  const backendRes = await fetch(backendUrl("/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      email,
      password,
      ...(organizationName ? { organizationName } : {}),
    }),
  });

  const data = await backendRes.json();

  if (!backendRes.ok) {
    return NextResponse.json(data, { status: backendRes.status });
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, data.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureRequest(request),
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return NextResponse.json({ user: data.user }, { status: 201 });
}
