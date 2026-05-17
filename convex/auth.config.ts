import type { AuthConfig } from "convex/server";

/**
 * Validates Clerk JWTs for Convex mutations/queries via ConvexProviderWithClerk.
 * Set CLERK_JWT_ISSUER_DOMAIN in Convex Dashboard env (Clerk Frontend API host,
 * e.g. https://your-app.clerk.accounts.dev).
 *
 * Clerk Dashboard → JWT Templates → Convex (application ID "convex").
 */
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
