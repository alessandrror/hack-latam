import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";

import { api } from "../../convex/_generated/api";

const JWT_TEMPLATE =
  process.env.NEXT_PUBLIC_CLERK_CONVEX_JWT_TEMPLATE?.trim() || "convex";

export function requireConvexDeploymentUrl(): string {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (!url || url.includes("not-configured.stub")) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured.");
  }
  return url;
}

/**
 * Convex HTTP client authenticated as the current Clerk user (for API routes).
 */
export async function convexAuthedClient(): Promise<ConvexHttpClient> {
  const { userId, getToken } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  const token = await getToken({ template: JWT_TEMPLATE as "convex" });
  if (!token) {
    throw new Error("Unauthorized");
  }
  const client = new ConvexHttpClient(requireConvexDeploymentUrl());
  client.setAuth(token);
  return client;
}

export { api };
