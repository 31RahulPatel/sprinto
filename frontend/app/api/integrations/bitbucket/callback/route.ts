import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(`${origin}/integrations?error=${encodeURIComponent(oauthError)}`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${origin}/integrations?error=missing_code_or_state`);
  }

  const res = await backendFetch("/integrations/bitbucket/callback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, state }),
  });

  if (!res.ok) {
    return NextResponse.redirect(`${origin}/integrations?error=connect_failed`);
  }

  const integration = await res.json();
  return NextResponse.redirect(`${origin}/integrations?connected=${integration.id}`);
}
