export const SESSION_COOKIE = "token";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 1 day, matches backend JWT expiresIn

export function backendUrl(path: string) {
  const base = process.env.BACKEND_URL ?? "http://localhost:4000";
  return `${base}${path}`;
}
