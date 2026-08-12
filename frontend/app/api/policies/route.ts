import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

export async function GET() {
  const res = await backendFetch("/policies");
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: Request) {
  const body = await request.json();
  const res = await backendFetch("/policies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
