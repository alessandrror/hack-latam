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
    domainVerifiedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  verifiedDomains: defineTable({
    userId: v.string(),
    domain: v.string(),
    method: v.union(v.literal("dns_txt"), v.literal("http_file")),
    token: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("failed"),
    ),
    verifiedAt: v.optional(v.number()),
    lastCheckedAt: v.optional(v.number()),
    failureReason: v.optional(v.string()),
    /** Set when Zavu accepted the domain-verified notification email */
    verificationEmailSentAt: v.optional(v.number()),
    verificationEmailMessageId: v.optional(v.string()),
    verificationEmailLastAttemptAt: v.optional(v.number()),
    verificationEmailLastError: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_domain", ["userId", "domain"]),

  aiInsightsCache: defineTable({
    normalizedTarget: v.string(),
    insights: v.any(),
    createdAt: v.number(),
    modelUsed: v.optional(v.string()),
  }).index("by_target", ["normalizedTarget"]),

  /** Audit trail for optional email-list OSINT: domains + counts only (no mailbox parts). */
  emailDomainSummaries: defineTable({
    userId: v.string(),
    target: v.string(),
    normalizedTarget: v.string(),
    scanMode: v.union(v.literal("quick"), v.literal("deep")),
    primaryApex: v.union(v.string(), v.null()),
    eligibleEmailDomains: v.array(v.string()),
    skippedExternalDomains: v.array(v.string()),
    parsedEmailLineCount: v.number(),
    truncatedEmailList: v.boolean(),
    truncatedUniqueDomainList: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  /** Chat history persisted for signed-in users. */
  chatSessions: defineTable({
    userId: v.string(),
    normalizedTarget: v.string(),
    scanMode: v.union(v.literal("quick"), v.literal("deep")),
    convexScanId: v.optional(v.string()),
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      }),
    ),
    updatedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_target", ["userId", "normalizedTarget", "scanMode"]),
});
