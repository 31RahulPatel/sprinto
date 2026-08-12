import { backendFetch } from "@/lib/backend-fetch";

export async function GET(request: Request) {
  const { search } = new URL(request.url);
  const res = await backendFetch(`/findings/export${search}`);
  const body = await res.arrayBuffer();

  return new Response(body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "text/csv",
      "Content-Disposition": res.headers.get("Content-Disposition") ?? "attachment; filename=findings.csv",
    },
  });
}
