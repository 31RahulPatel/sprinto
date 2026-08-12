import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; slug: string }> },
) {
  const { id, slug } = await params;
  const body = await request.json();
  const res = await backendFetch(`/integrations/${id}/repositories/${slug}/selection`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
