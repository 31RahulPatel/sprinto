import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

export async function GET(request: Request) {
  const { search } = new URL(request.url);
  const res = await backendFetch(`/scans${search}`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: Request) {
  const body = await request.json();
  const res = await backendFetch("/scans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
