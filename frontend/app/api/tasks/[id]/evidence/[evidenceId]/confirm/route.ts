import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; evidenceId: string }> },
) {
  const { id, evidenceId } = await params;
  const body = await request.json();
  const res = await backendFetch(`/tasks/${id}/evidence/${evidenceId}/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
