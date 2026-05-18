import {
  buildChatUserContent,
  CHAT_SYSTEM_PROMPT,
  parseChatModelOutput,
} from "@/lib/ai/chat-prompt";
import { callOpenRouterCompletion } from "@/lib/ai/openrouter";
import { parseScanSnapshot } from "@/lib/ai/parse-scan-snapshot";
import type { AiChatRequestBody, AiChatResponseBody } from "@/types/ai-chat";
import type { AiInsightsResponseBody } from "@/types/ai-insights";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function isInsightsResponse(x: unknown): x is AiInsightsResponseBody {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.executiveSummary === "string" &&
    Array.isArray(o.topActions) &&
    Array.isArray(o.disclaimers) &&
    typeof o.perFindingInsightsById === "object" &&
    o.perFindingInsightsById !== null
  );
}

function parseChatBody(payload: unknown): AiChatRequestBody | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;

  const scanSnapshot = parseScanSnapshot(p.scanSnapshot);
  if (!scanSnapshot) return null;

  if (!isInsightsResponse(p.priorInsights)) return null;

  const messagesRaw = p.messages;
  if (!Array.isArray(messagesRaw) || messagesRaw.length === 0) return null;

  const messages: AiChatRequestBody["messages"] = [];
  for (const m of messagesRaw) {
    if (!m || typeof m !== "object") return null;
    const o = m as Record<string, unknown>;
    if (o.role !== "user" && o.role !== "assistant") return null;
    if (typeof o.content !== "string") return null;
    messages.push({ role: o.role, content: o.content });
  }

  // The model prompt assumes the last message is authored by the user.
  if (messages[messages.length - 1]?.role !== "user") return null;
  const lastUser = messages[messages.length - 1];
  if (!lastUser.content.trim()) return null;

  return {
    scanSnapshot,
    priorInsights: p.priorInsights as AiInsightsResponseBody,
    messages,
  };
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Debes iniciar sesión para usar el chat de refinamiento." },
      { status: 401 },
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "IA no configurada. Define OPENROUTER_API_KEY." },
      { status: 503 },
    );
  }
  const openRouterKey = apiKey;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  const body = parseChatBody(json);
  if (!body) {
    return NextResponse.json(
      {
        error:
          "Cuerpo inválido. Requiere scanSnapshot, priorInsights (resultado previo de /api/ai/insights) y messages[].",
      },
      { status: 400 },
    );
  }

  const primary =
    process.env.OPENROUTER_MODEL_PRIMARY?.trim() ||
    "mistralai/mistral-small-24b-instruct-2501";
  const fallback =
    process.env.OPENROUTER_MODEL_FALLBACK?.trim() || "openai/gpt-4o-mini";

  const userContent = buildChatUserContent(body);

  async function runModel(model: string): Promise<AiChatResponseBody & { modelUsed: string }> {
    const { rawText, model: used } = await callOpenRouterCompletion({
      apiKey: openRouterKey,
      model,
      messages: [
        { role: "system", content: CHAT_SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    });
    const parsed = parseChatModelOutput(rawText);
    return { ...parsed, modelUsed: used };
  }

  try {
    const out = await runModel(primary);
    return NextResponse.json(out);
  } catch (firstErr) {
    if (!fallback || fallback === primary) {
      const msg =
        firstErr instanceof Error
          ? firstErr.message
          : "Error en generación del chat.";
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  }

  try {
    const out = await runModel(fallback);
    return NextResponse.json(out);
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Fallo primario y de respaldo.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
