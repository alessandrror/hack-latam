import {
  internalMutationGeneric,
  internalQueryGeneric,
} from "convex/server";
import { v } from "convex/values";

const verifyMethod = v.union(v.literal("dns_txt"), v.literal("http_file"));

const verifyStatus = v.union(
  v.literal("pending"),
  v.literal("verified"),
  v.literal("failed"),
);

export const internalGetRow = internalQueryGeneric({
  args: {
    userId: v.string(),
    domain: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("verifiedDomains"),
      method: verifyMethod,
      token: v.string(),
      status: verifyStatus,
      domain: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("verifiedDomains")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("domain"), args.domain))
      .first();
    if (!row) {
      return null;
    }
    return {
      _id: row._id,
      method: row.method,
      token: row.token,
      status: row.status,
      domain: row.domain,
    };
  },
});

export const internalApplyVerification = internalMutationGeneric({
  args: {
    userId: v.string(),
    domain: v.string(),
    status: v.union(v.literal("verified"), v.literal("failed")),
    failureReason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("verifiedDomains")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("domain"), args.domain))
      .first();
    if (!row) {
      return null;
    }
    const now = Date.now();
    if (args.status === "verified") {
      await ctx.db.patch(row._id, {
        status: "verified",
        verifiedAt: now,
        lastCheckedAt: now,
        failureReason: undefined,
      });
    } else {
      await ctx.db.patch(row._id, {
        status: "failed",
        lastCheckedAt: now,
        failureReason: args.failureReason ?? "Verification failed.",
      });
    }
    return null;
  },
});
