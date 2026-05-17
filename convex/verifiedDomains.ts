import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const verifyMethod = v.union(v.literal("dns_txt"), v.literal("http_file"));

const verifyStatus = v.union(
  v.literal("pending"),
  v.literal("verified"),
  v.literal("failed"),
);

function randomTokenHex(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const initiate = mutationGeneric({
  args: {
    domain: v.string(),
    method: verifyMethod,
  },
  returns: v.union(
    v.object({
      outcome: v.literal("already_verified"),
      domain: v.string(),
      verifiedAt: v.number(),
    }),
    v.object({
      outcome: v.literal("pending"),
      domain: v.string(),
      method: verifyMethod,
      token: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db
      .query("verifiedDomains")
      .withIndex("by_user", (q) =>
        q.eq("userId", identity.tokenIdentifier),
      )
      .filter((q) => q.eq(q.field("domain"), args.domain))
      .first();

    const now = Date.now();

    if (existing?.status === "verified") {
      return {
        outcome: "already_verified" as const,
        domain: args.domain,
        verifiedAt: existing.verifiedAt ?? existing.createdAt,
      };
    }

    const token = randomTokenHex();

    if (existing) {
      await ctx.db.patch(existing._id, {
        method: args.method,
        token,
        status: "pending",
        failureReason: undefined,
        lastCheckedAt: undefined,
        verifiedAt: undefined,
      });
      return {
        outcome: "pending" as const,
        domain: args.domain,
        method: args.method,
        token,
      };
    }

    await ctx.db.insert("verifiedDomains", {
      userId: identity.tokenIdentifier,
      domain: args.domain,
      method: args.method,
      token,
      status: "pending",
      createdAt: now,
    });

    return {
      outcome: "pending" as const,
      domain: args.domain,
      method: args.method,
      token,
    };
  },
});

export const getStatus = queryGeneric({
  args: { domain: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      status: verifyStatus,
      method: verifyMethod,
      token: v.optional(v.string()),
      verifiedAt: v.optional(v.number()),
      failureReason: v.optional(v.string()),
      lastCheckedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const row = await ctx.db
      .query("verifiedDomains")
      .withIndex("by_user", (q) =>
        q.eq("userId", identity.tokenIdentifier),
      )
      .filter((q) => q.eq(q.field("domain"), args.domain))
      .first();

    if (!row) {
      return null;
    }

    return {
      status: row.status,
      method: row.method,
      token: row.status === "pending" ? row.token : undefined,
      verifiedAt: row.verifiedAt,
      failureReason: row.failureReason,
      lastCheckedAt: row.lastCheckedAt,
    };
  },
});

export const listForUser = queryGeneric({
  args: {},
  returns: v.array(
    v.object({
      domain: v.string(),
      status: verifyStatus,
      method: verifyMethod,
      verifiedAt: v.optional(v.number()),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const rows = await ctx.db
      .query("verifiedDomains")
      .withIndex("by_user", (q) => q.eq("userId", identity.tokenIdentifier))
      .collect();

    return rows.map((r) => ({
      domain: r.domain,
      status: r.status,
      method: r.method,
      verifiedAt: r.verifiedAt,
      createdAt: r.createdAt,
    }));
  },
});
