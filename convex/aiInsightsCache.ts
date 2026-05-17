import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const TWENTY_FOUR_H_MS = 24 * 60 * 60 * 1000;

/**
 * Validates writes from trusted server (Next.js route). Set INSIGHTS_CACHE_WRITE_SECRET
 * in Convex Dashboard to the same value as in Next.js `.env.local`.
 */
function validateCacheWriteSecret(provided: string): boolean {
  const expected = process.env.INSIGHTS_CACHE_WRITE_SECRET;
  if (!expected || expected.length === 0) {
    console.warn(
      "INSIGHTS_CACHE_WRITE_SECRET is not set — refusing cache writes from API.",
    );
    return false;
  }
  return provided === expected;
}

export const getCached = queryGeneric({
  args: { normalizedTarget: v.string(), now: v.number() },
  returns: v.union(
    v.object({
      insights: v.any(),
      modelUsed: v.optional(v.string()),
      cached: v.literal(true),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("aiInsightsCache")
      .withIndex("by_target", (q) =>
        q.eq("normalizedTarget", args.normalizedTarget.trim().toLowerCase()),
      )
      .first();

    if (!row) {
      return null;
    }

    if (Date.now() - row.createdAt >= TWENTY_FOUR_H_MS) {
      return null;
    }

    return {
      insights: row.insights,
      modelUsed: row.modelUsed,
      cached: true as const,
    };
  },
});

export const setCached = mutationGeneric({
  args: {
    secret: v.string(),
    normalizedTarget: v.string(),
    insights: v.any(),
    modelUsed: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!validateCacheWriteSecret(args.secret)) {
      throw new Error("Unauthorized cache write.");
    }

    const key = args.normalizedTarget.trim().toLowerCase();
    const existing = await ctx.db
      .query("aiInsightsCache")
      .withIndex("by_target", (q) => q.eq("normalizedTarget", key))
      .first();

    const now = Date.now();
    const payload = {
      normalizedTarget: key,
      insights: args.insights,
      createdAt: now,
      ...(args.modelUsed ? { modelUsed: args.modelUsed } : {}),
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
    } else {
      await ctx.db.insert("aiInsightsCache", payload);
    }

    return null;
  },
});
