import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const res = await backendFetch(`/integrations/${id}/members`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
