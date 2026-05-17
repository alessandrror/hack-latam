import type { AiInsightsRequestBody, AiInsightsResponseBody } from "./ai-insights";

export type AiChatMessageRole = "user" | "assistant";

export interface AiChatMessage {
  role: AiChatMessageRole;
  content: string;
}

/** POST body for `/api/ai/chat`. */
export interface AiChatRequestBody {
  scanSnapshot: AiInsightsRequestBody;
  priorInsights?: AiInsightsResponseBody;
  messages: AiChatMessage[];
}

export interface AiChatResponseBody {
  reply: string;
  citedFindingIds?: string[];
  citedChecklistIds?: string[];
  disclaimers?: string[];
  modelUsed?: string;
}

export const AI_CHAT_LIMITS = {
  /** New user input in the composer. */
  maxMessageLength: 2000,
  /** Prior turns in the thread (assistant replies can be long). */
  maxHistoryMessageLength: 12_000,
  maxMessagesInRequest: 20,
  maxMessagesSentToModel: 8,
  maxTurnsPerSession: 10,
  rateLimitPerHour: 40,
} as const;
