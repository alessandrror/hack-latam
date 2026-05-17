import type { AiInsightsRequestBody, AiInsightsResponseBody } from "@/types/ai-insights";

/** One message in the guided refinement thread (MVP). */
export type AiChatMessage = {
  role: "user" | "assistant";
  content: string;
};

/** POST body for `POST /api/ai/chat` (see docs/ai-chat-refinement-prd.md). */
export interface AiChatRequestBody {
  /** Current scan snapshot (same minimal shape as insights input). */
  scanSnapshot: AiInsightsRequestBody;
  /** Structured output from a prior successful `POST /api/ai/insights` call. */
  priorInsights: AiInsightsResponseBody;
  /** Last user question is the final `user` message. */
  messages: AiChatMessage[];
}

/** JSON response from `POST /api/ai/chat`. */
export interface AiChatResponseBody {
  reply: string;
  citedFindingIds?: string[];
  disclaimers?: string[];
  modelUsed?: string;
}

export const AI_CHAT_LIMITS = {
  maxMessageLength: 2000,
  maxMessagesInRequest: 20,
  maxMessagesSentToModel: 8,
  maxTurnsPerSession: 10,
  rateLimitPerHour: 40,
} as const;
