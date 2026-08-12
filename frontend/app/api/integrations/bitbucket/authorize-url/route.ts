import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

export async function GET() {
  const res = await backendFetch("/integrations/bitbucket/authorize-url");
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
