import { mutationGeneric } from "convex/server";
import { v } from "convex/values";

/** Avoid oversized documents — UI caps are smaller; persist a safety ceiling. */
const MAX_STORED_DOMAINS = 80;

const scanMode = v.union(v.literal("quick"), v.literal("deep"));

export const recordEmailDomainSummary = mutationGeneric({
  args: {
    target: v.string(),
    normalizedTarget: v.string(),
    scanMode,
    primaryApex: v.union(v.string(), v.null()),
    eligibleEmailDomains: v.array(v.string()),
    skippedExternalDomains: v.array(v.string()),
    parsedEmailLineCount: v.number(),
    truncatedEmailList: v.boolean(),
    truncatedUniqueDomainList: v.boolean(),
  },
  returns: v.id("emailDomainSummaries"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const eligible = args.eligibleEmailDomains.slice(0, MAX_STORED_DOMAINS);
    const skipped = args.skippedExternalDomains.slice(0, MAX_STORED_DOMAINS);

    return await ctx.db.insert("emailDomainSummaries", {
      userId: identity.tokenIdentifier,
      target: args.target,
      normalizedTarget: args.normalizedTarget,
      scanMode: args.scanMode,
      primaryApex: args.primaryApex,
      eligibleEmailDomains: eligible,
      skippedExternalDomains: skipped,
      parsedEmailLineCount: args.parsedEmailLineCount,
      truncatedEmailList: args.truncatedEmailList,
      truncatedUniqueDomainList: args.truncatedUniqueDomainList,
      createdAt: Date.now(),
    });
  },
});
