import {
  buildUserPrompt,
  getInsightsSystemPrompt,
  parseInsightsModelOutput,
} from "@/lib/ai/insights-prompt";
import { callOpenRouterCompletion } from "@/lib/ai/openrouter";
import { parseScanSnapshot } from "@/lib/ai/parse-scan-snapshot";
import type { AiInsightsResponseBody } from "@/types/ai-insights";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

async function generateWithModel(params: {
  apiKey: string;
  model: string;
  userContent: string;
  scanMode: "deep" | "quick";
}): Promise<AiInsightsResponseBody & { modelUsed: string }> {
  const { rawText, model } = await callOpenRouterCompletion({
    apiKey: params.apiKey,
    model: params.model,
    messages: [
      {
        role: "system",
        content: getInsightsSystemPrompt(params.scanMode),
      },
      { role: "user", content: params.userContent },
    ],
  });

  const parsed = parseInsightsModelOutput(rawText);
  return { ...parsed, modelUsed: model };
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "AI insights are not configured. Set OPENROUTER_API_KEY (see project .env.example).",
      },
      { status: 503 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validated = parseScanSnapshot(json);
  if (!validated) {
    return NextResponse.json(
      {
        error:
          "Missing or invalid body. Expect normalizedTarget, inputKind, totalHostnames, hostnameSampleShownCount, findings[], and modules[].",
      },
      { status: 400 },
    );
  }

  const primary =
    process.env.OPENROUTER_MODEL_PRIMARY?.trim() ||
    "mistralai/mistral-small-24b-instruct-2501";
  const fallback =
    process.env.OPENROUTER_MODEL_FALLBACK?.trim() || "openai/gpt-4o-mini";

  const userContent = buildUserPrompt(validated);

  let lastErr: unknown;
  try {
    const primaryResult = await generateWithModel({
      apiKey,
      model: primary,
      userContent,
      scanMode: validated.scanMode ?? "deep",
    });
    return NextResponse.json(primaryResult);
  } catch (e) {
    lastErr = e;
  }

  if (!fallback || fallback === primary) {
    const msg =
      lastErr instanceof Error ? lastErr.message : "Insights generation failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  try {
    const fallbackResult = await generateWithModel({
      apiKey,
      model: fallback,
      userContent,
      scanMode: validated.scanMode ?? "deep",
    });
    return NextResponse.json(fallbackResult);
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : `${lastErr instanceof Error ? lastErr.message : "Primary failed"}, fallback failed.`;
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
