export const SESSION_COOKIE = "token";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 1 day, matches backend JWT expiresIn

export function backendUrl(path: string) {
  const base = process.env.BACKEND_URL ?? "http://localhost:4000";
  return `${base}${path}`;
}

// NODE_ENV=production doesn't mean the request arrived over HTTPS — self-hosted deployments
// often serve plain HTTP behind an IP before a domain/TLS is set up, and a `Secure` cookie is
// silently dropped by the browser on such a request with no visible error. Check the actual
// scheme instead, deferring to X-Forwarded-Proto when behind a reverse proxy.
export function isSecureRequest(request: Request): boolean {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  return forwardedProto ? forwardedProto === "https" : new URL(request.url).protocol === "https:";
}
