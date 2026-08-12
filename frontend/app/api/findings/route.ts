import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

export async function GET(request: Request) {
  const { search } = new URL(request.url);
  const res = await backendFetch(`/findings${search}`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
