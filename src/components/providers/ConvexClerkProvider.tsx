"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { useCallback, useMemo } from "react";
import type { ReactNode } from "react";

const rawUrl =
  typeof process.env.NEXT_PUBLIC_CONVEX_URL === "string"
    ? process.env.NEXT_PUBLIC_CONVEX_URL.trim()
    : "";

if (typeof window !== "undefined" && !rawUrl.length) {
  console.warn(
    "NEXT_PUBLIC_CONVEX_URL is not set — using a stub Convex deployment URL until configured.",
  );
}

const convexClient = new ConvexReactClient(
  rawUrl.length > 0 ? rawUrl : "https://not-configured.stub.convex.cloud",
);

export function ConvexClerkProvider({ children }: { children: ReactNode }) {
  const clerkAuth = useAuth();
  const {
    isLoaded,
    isSignedIn,
    getToken,
  } = clerkAuth;

  const jwtTemplate =
    process.env.NEXT_PUBLIC_CLERK_CONVEX_JWT_TEMPLATE?.trim() || "convex";

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      try {
        return await getToken({
          template: jwtTemplate as "convex",
          skipCache: forceRefreshToken,
        });
      } catch {
        return null;
      }
    },
    [getToken, jwtTemplate],
  );

  const useAuthAdapter = useMemo(() => {
    const isAuthenticated = isSignedIn ?? false;
    return () => ({
      isLoading: !isLoaded,
      isAuthenticated,
      fetchAccessToken,
    });
  }, [fetchAccessToken, isLoaded, isSignedIn]);

  return (
    <ConvexProviderWithAuth client={convexClient} useAuth={useAuthAdapter}>
      {children}
    </ConvexProviderWithAuth>
  );
}
