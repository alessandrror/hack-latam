import { ConvexHttpClient } from "convex/browser";

/**
 * Create a short-lived HTTP client for server routes. Do not share across requests.
 * @param jwt - Clerk Convex template JWT for user-scoped mutations; omit for anonymous queries.
 */
export function createConvexHttpClient(jwt?: string | null): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured.");
  }
  const client = new ConvexHttpClient(url);
  if (jwt) {
    client.setAuth(jwt);
  }
  return client;
}
