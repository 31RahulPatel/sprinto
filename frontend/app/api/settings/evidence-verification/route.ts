import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

export async function GET() {
  const res = await backendFetch("/settings/evidence-verification");
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const res = await backendFetch("/settings/evidence-verification", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
