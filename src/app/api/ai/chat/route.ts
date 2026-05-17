import {
  buildChatUserPrompt,
  getChatSystemPrompt,
  parseChatModelOutput,
} from "@/lib/ai/chat-prompt";
import { callOpenRouterCompletion } from "@/lib/ai/openrouter";
import { parseScanSnapshot } from "@/lib/ai/parse-scan-snapshot";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import type { AiInsightsResponseBody } from "@/types/ai-insights";
import {
  AI_CHAT_LIMITS,
  type AiChatMessage,
  type AiChatRequestBody,
  type AiChatResponseBody,
} from "@/types/ai-chat";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function parsePriorInsights(raw: unknown): AiInsightsResponseBody | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  if (typeof o.executiveSummary !== "string") return undefined;
  if (!Array.isArray(o.topActions) || !Array.isArray(o.disclaimers)) {
    return undefined;
  }
  return raw as AiInsightsResponseBody;
}

function normalizeChatMessageContent(
  content: string,
  role: AiChatMessage["role"],
  isLatestUserMessage: boolean,
): string | null {
  const trimmed = content.trim();
  if (!trimmed) return null;

  const maxLen = isLatestUserMessage
    ? AI_CHAT_LIMITS.maxMessageLength
    : AI_CHAT_LIMITS.maxHistoryMessageLength;

  if (trimmed.length > maxLen) {
    if (isLatestUserMessage) return null;
    return `${trimmed.slice(0, maxLen - 1)}…`;
  }
  return trimmed;
}

function parseChatMessages(raw: unknown): AiChatMessage[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: AiChatMessage[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== "object") return null;
    const m = item as Record<string, unknown>;
    if (m.role !== "user" && m.role !== "assistant") return null;
    if (typeof m.content !== "string") return null;

    const isLatest = i === raw.length - 1;
    const isLatestUser = isLatest && m.role === "user";
    const content = normalizeChatMessageContent(
      m.content,
      m.role as AiChatMessage["role"],
      isLatestUser,
    );
    if (!content) return null;
    out.push({ role: m.role, content });
  }
  if (out[out.length - 1]?.role !== "user") return null;
  return out;
}

function parseChatRequestBody(payload: unknown): AiChatRequestBody | null {
  if (!payload || typeof payload !== "object") return null;
  const snapshot = parseScanSnapshot(payload);
  if (!snapshot) return null;

  const root = payload as Record<string, unknown>;
  const messages = parseChatMessages(root.messages);
  if (!messages) return null;

  if (messages.length > AI_CHAT_LIMITS.maxMessagesInRequest) return null;

  const userTurns = messages.filter((m) => m.role === "user").length;
  if (userTurns > AI_CHAT_LIMITS.maxTurnsPerSession) return null;

  const priorInsights = parsePriorInsights(root.priorInsights);

  return { scanSnapshot: snapshot, priorInsights, messages };
}

async function generateChatReply(params: {
  apiKey: string;
  model: string;
  scanMode: "deep" | "quick";
  body: AiChatRequestBody;
}): Promise<AiChatResponseBody & { modelUsed: string }> {
  const recentMessages = params.body.messages.slice(
    -AI_CHAT_LIMITS.maxMessagesSentToModel,
  );
  const userContent = buildChatUserPrompt({
    snapshot: params.body.scanSnapshot,
    priorInsights: params.body.priorInsights,
    recentMessages,
  });

  const { rawText, model } = await callOpenRouterCompletion({
    apiKey: params.apiKey,
    model: params.model,
    messages: [
      { role: "system", content: getChatSystemPrompt(params.scanMode) },
      { role: "user", content: userContent },
    ],
  });

  const parsed = parseChatModelOutput(rawText);
  return { ...parsed, modelUsed: model };
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Debes iniciar sesión para usar el chat de seguimiento." },
      { status: 401 },
    );
  }

  const rateKey = `ai-chat:${userId}`;
  const rate = checkRateLimit(
    rateKey,
    AI_CHAT_LIMITS.rateLimitPerHour,
    60 * 60 * 1000,
  );
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `Límite de mensajes alcanzado. Intenta de nuevo en ${rate.retryAfterSec ?? 60}s.`,
      },
      {
        status: 429,
        headers: rate.retryAfterSec
          ? { "Retry-After": String(rate.retryAfterSec) }
          : undefined,
      },
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "El chat de IA no está configurado. Configura OPENROUTER_API_KEY.",
      },
      { status: 503 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  const validated = parseChatRequestBody(json);
  if (!validated) {
    return NextResponse.json(
      {
        error:
          "Cuerpo inválido. Revisa scanSnapshot, que el último mensaje sea del usuario (máx. 2000 caracteres) y que priorInsights exista si ya generaste orientación IA.",
      },
      { status: 400 },
    );
  }

  if (!validated.priorInsights) {
    return NextResponse.json(
      {
        error:
          "Genera primero los insights estructurados antes de usar el chat de seguimiento.",
      },
      { status: 400 },
    );
  }

  const primary =
    process.env.OPENROUTER_MODEL_PRIMARY?.trim() ||
    "mistralai/mistral-small-24b-instruct-2501";
  const fallback =
    process.env.OPENROUTER_MODEL_FALLBACK?.trim() || "openai/gpt-4o-mini";
  const scanMode = validated.scanSnapshot.scanMode ?? "deep";

  let lastErr: unknown;
  try {
    const primaryResult = await generateChatReply({
      apiKey,
      model: primary,
      scanMode,
      body: validated,
    });
    return NextResponse.json(primaryResult);
  } catch (e) {
    lastErr = e;
  }

  if (!fallback || fallback === primary) {
    const msg =
      lastErr instanceof Error ? lastErr.message : "Error al generar respuesta.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  try {
    const fallbackResult = await generateChatReply({
      apiKey,
      model: fallback,
      scanMode,
      body: validated,
    });
    return NextResponse.json(fallbackResult);
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.message
        : `${lastErr instanceof Error ? lastErr.message : "Falló el modelo principal"}, fallback falló.`;
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
