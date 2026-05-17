import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  scans: defineTable({
    userId: v.string(),
    target: v.string(),
    normalizedTarget: v.string(),
    inputKind: v.union(
      v.literal("domain"),
      v.literal("ip"),
      v.literal("unknown"),
    ),
    scanMode: v.union(v.literal("quick"), v.literal("deep")),
    findings: v.array(v.any()),
    modules: v.array(v.any()),
    aiInsights: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  aiInsightsCache: defineTable({
    normalizedTarget: v.string(),
    insights: v.any(),
    createdAt: v.number(),
    modelUsed: v.optional(v.string()),
  }).index("by_target", ["normalizedTarget"]),
});
