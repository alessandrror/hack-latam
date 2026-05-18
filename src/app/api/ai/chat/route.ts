import {
  buildChatUserContent,
  CHAT_SYSTEM_PROMPT,
  parseChatModelOutput,
} from "@/lib/ai/chat-prompt";
import {
  callOpenRouterCompletion,
  callOpenRouterCompletionStream,
} from "@/lib/ai/openrouter";
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

  const wantsSse =
    request.headers.get("accept")?.includes("text/event-stream") ?? false;

  if (!wantsSse) {
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

      try {
        const out = await runModel(fallback);
        return NextResponse.json(out);
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Fallo primario y de respaldo.";
        return NextResponse.json({ error: msg }, { status: 502 });
      }
    }
  }

  {
    const encoder = new TextEncoder();

    function createReplyExtractor(onDelta: (chunk: string) => void) {
      type Stage = "searching" | "inReply" | "done";
      let stage: Stage = "searching";

      let searchBuffer = "";

      let escaping = false;
      let unicodeMode = false;
      let unicodeHex = "";

      const emit = (s: string) => {
        if (!s) return;
        onDelta(s);
      };

      const decodeEscapedChar = (esc: string) => {
        switch (esc) {
          case '"':
            return '"';
          case "\\":
            return "\\";
          case "/":
            return "/";
          case "b":
            return "\b";
          case "f":
            return "\f";
          case "n":
            return "\n";
          case "r":
            return "\r";
          case "t":
            return "\t";
          default:
            return esc;
        }
      };

      const processChar = (c: string) => {
        if (stage === "done") return;

        if (stage === "searching") {
          searchBuffer += c;
          if (searchBuffer.length > 200) {
            searchBuffer = searchBuffer.slice(-200);
          }

          const m = /"reply"\s*:\s*"/.exec(searchBuffer);
          if (!m) return;

          stage = "inReply";

          const after = searchBuffer.slice(m.index + m[0].length);
          searchBuffer = "";

          for (const ch of after) processChar(ch);
          return;
        }

        if (unicodeMode) {
          unicodeHex += c;
          if (unicodeHex.length === 4) {
            const code = Number.parseInt(unicodeHex, 16);
            if (Number.isFinite(code)) emit(String.fromCharCode(code));
            unicodeMode = false;
            unicodeHex = "";
            escaping = false;
          }
          return;
        }

        if (escaping) {
          if (c === "u") {
            unicodeMode = true;
            unicodeHex = "";
            return;
          }
          emit(decodeEscapedChar(c));
          escaping = false;
          return;
        }

        if (c === "\\") {
          escaping = true;
          return;
        }

        if (c === '"') {
          stage = "done";
          return;
        }

        emit(c);
      };

      return {
        push: (rawChunk: string) => {
          for (const c of rawChunk) processChar(c);
        },
      };
    }

    const stream = new ReadableStream({
      async start(controller) {
        const writeEvent = (payload: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        };

        let anyDeltas = false;
        let parsed: AiChatResponseBody | null = null;
        let modelUsed: string = primary;
        let rawText = "";

        const messagesForModel: { role: "system" | "user"; content: string }[] = [
          { role: "system", content: CHAT_SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ];

        const tryModel = async (modelName: string) => {
          rawText = "";
          anyDeltas = false;

          const extractor = createReplyExtractor((chunk) => {
            if (!chunk) return;
            anyDeltas = true;
            writeEvent({ type: "delta", chunk });
          });

          const out = await callOpenRouterCompletionStream({
            apiKey: openRouterKey,
            model: modelName,
            messages: messagesForModel,
            onDelta: (delta) => {
              rawText += delta;
              extractor.push(delta);
            },
          });

          modelUsed = out.model;
          parsed = parseChatModelOutput(rawText);
        };

        try {
          writeEvent({ type: "start", modelUsed: primary });
          await tryModel(primary);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Error en generación del chat.";
          if (!fallback || fallback === primary || anyDeltas) {
            writeEvent({ type: "error", error: msg });
            controller.close();
            return;
          }

          try {
            writeEvent({ type: "start", modelUsed: fallback });
            await tryModel(fallback);
          } catch {
            writeEvent({ type: "error", error: msg });
            controller.close();
            return;
          }
        }

        if (!parsed) {
          writeEvent({
            type: "error",
            error: "Error en generación del chat.",
          });
          controller.close();
          return;
        }

        const finalParsed: AiChatResponseBody = parsed;

        writeEvent({
          type: "final",
          reply: finalParsed.reply,
          citedFindingIds: finalParsed.citedFindingIds ?? [],
          disclaimers: finalParsed.disclaimers ?? [],
          modelUsed,
        });
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }
}
