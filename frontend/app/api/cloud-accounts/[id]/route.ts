import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const res = await backendFetch(`/cloud-accounts/${id}`, { method: "DELETE" });
  const text = await res.text();
  if (!text) {
    return new NextResponse(null, { status: res.status });
  }
  return NextResponse.json(JSON.parse(text), { status: res.status });
}
