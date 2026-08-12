import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

// Redirects the browser straight to a short-lived signed S3 URL — the file's bytes never
// pass through this server or the backend.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; evidenceId: string }> },
) {
  const { id, evidenceId } = await params;
  const res = await backendFetch(`/tasks/${id}/evidence/${evidenceId}/file`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  }
  const { url } = await res.json();
  return NextResponse.redirect(url);
}
