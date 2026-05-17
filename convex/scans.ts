import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const inputKind = v.union(
  v.literal("domain"),
  v.literal("ip"),
  v.literal("unknown"),
);

const scanMode = v.union(v.literal("quick"), v.literal("deep"));

export const createScan = mutationGeneric({
  args: {
    target: v.string(),
    normalizedTarget: v.string(),
    inputKind,
    scanMode,
    findings: v.array(v.any()),
    modules: v.array(v.any()),
  },
  returns: v.id("scans"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    return await ctx.db.insert("scans", {
      userId: identity.tokenIdentifier,
      target: args.target,
      normalizedTarget: args.normalizedTarget,
      inputKind: args.inputKind,
      scanMode: args.scanMode,
      findings: args.findings,
      modules: args.modules,
      createdAt: Date.now(),
    });
  },
});

export const updateScanInsights = mutationGeneric({
  args: {
    scanId: v.id("scans"),
    aiInsights: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const scan = await ctx.db.get(args.scanId);
    if (!scan || scan.userId !== identity.tokenIdentifier) {
      throw new Error("Forbidden");
    }

    await ctx.db.patch(args.scanId, { aiInsights: args.aiInsights });
    return null;
  },
});

export const getUserScans = queryGeneric({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("scans"),
      _creationTime: v.number(),
      userId: v.string(),
      target: v.string(),
      normalizedTarget: v.string(),
      inputKind,
      scanMode,
      findings: v.array(v.any()),
      modules: v.array(v.any()),
      aiInsights: v.optional(v.any()),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const rows = await ctx.db
      .query("scans")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});
