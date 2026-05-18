import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const scanMode = v.union(v.literal("quick"), v.literal("deep"));

const aiMessage = v.object({
  role: v.union(v.literal("user"), v.literal("assistant")),
  content: v.string(),
});

// Keep bounded payloads to avoid document size growth.
const MAX_STORED_MESSAGES = 20; // 10 turns * (user+assistant)
const MAX_MESSAGE_CHARS = 2000;

function truncateMessageContent(msg: { role: "user" | "assistant"; content: string }) {
  const content = msg.content.trim();
  if (content.length <= MAX_MESSAGE_CHARS) return msg;
  return { ...msg, content: `${content.slice(0, MAX_MESSAGE_CHARS - 1)}…` };
}

function truncateMessages(messages: Array<{ role: "user" | "assistant"; content: string }>) {
  const normalized = messages.map(truncateMessageContent);
  return normalized.length > MAX_STORED_MESSAGES
    ? normalized.slice(normalized.length - MAX_STORED_MESSAGES)
    : normalized;
}

export const getMessages = queryGeneric({
  args: {
    normalizedTarget: v.string(),
    scanMode,
  },
  returns: v.array(aiMessage),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const key = args.normalizedTarget.trim().toLowerCase();
    const row = await ctx.db
      .query("chatSessions")
      .withIndex("by_user", (q) => q.eq("userId", identity.tokenIdentifier))
      .filter((q) => q.eq(q.field("normalizedTarget"), key))
      .filter((q) => q.eq(q.field("scanMode"), args.scanMode))
      .first();

    return row?.messages ?? [];
  },
});

export const upsertMessages = mutationGeneric({
  args: {
    normalizedTarget: v.string(),
    scanMode,
    convexScanId: v.optional(v.string()),
    messages: v.array(aiMessage),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const key = args.normalizedTarget.trim().toLowerCase();
    const nextMessages = truncateMessages(args.messages);

    const existing = await ctx.db
      .query("chatSessions")
      .withIndex("by_user", (q) => q.eq("userId", identity.tokenIdentifier))
      .filter((q) => q.eq(q.field("normalizedTarget"), key))
      .filter((q) => q.eq(q.field("scanMode"), args.scanMode))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        convexScanId: args.convexScanId,
        messages: nextMessages,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("chatSessions", {
        userId: identity.tokenIdentifier,
        normalizedTarget: key,
        scanMode: args.scanMode,
        convexScanId: args.convexScanId,
        messages: nextMessages,
        createdAt: now,
        updatedAt: now,
      });
    }

    return null;
  },
});

