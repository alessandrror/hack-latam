import {
  buildUserPrompt,
  getInsightsSystemPrompt,
  parseInsightsModelOutput,
} from "@/lib/ai/insights-prompt";
import { callOpenRouterCompletion } from "@/lib/ai/openrouter";
import { parseScanSnapshot } from "@/lib/ai/parse-scan-snapshot";
import { createConvexHttpClient } from "@/lib/convex/httpClient";
import type {
  AiInsightsRequestBody,
  AiInsightsResponseBody,
} from "@/types/ai-insights";
import { auth } from "@clerk/nextjs/server";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function parseRequestBody(payload: unknown): AiInsightsRequestBody | null {
  if (!payload || typeof payload !== "object") return null;

  const base = parseScanSnapshot(payload);
  if (!base) return null;

  const p = payload as Record<string, unknown>;
  const convexScanId =
    typeof p.convexScanId === "string" && p.convexScanId.trim().length > 0
      ? p.convexScanId.trim()
      : undefined;

  const forceRefresh =
    typeof p.forceRefresh === "boolean" ? p.forceRefresh : false;

  return {
    ...base,
    ...(convexScanId ? { convexScanId } : {}),
    forceRefresh,
  };
}

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
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Debes iniciar sesión para generar orientación con IA." },
      { status: 401 },
    );
  }

  const template =
    process.env.NEXT_PUBLIC_CLERK_CONVEX_JWT_TEMPLATE?.trim() || "convex";
  const jwt = await getToken({ template: template as "convex" }).catch(
    () => null,
  );
  if (!jwt) {
    return NextResponse.json(
      { error: "No se pudo obtener token de sesión. Vuelve a entrar." },
      { status: 401 },
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "IA no configurada. Define OPENROUTER_API_KEY (ver .env.example).",
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

  const validated = parseRequestBody(json);
  if (!validated) {
    return NextResponse.json(
      {
        error:
          "Falta o es inválido el cuerpo. Requiere normalizedTarget, inputKind, totalHostnames, hostnameSampleShownCount, findings[] y modules[].",
      },
      { status: 400 },
    );
  }

  const cacheKey = validated.normalizedTarget.trim().toLowerCase();
  const unauthenticatedClient = createConvexHttpClient();

  /** Cache uses only `normalizedTarget` (quick y deep comparten entrada — ver producto). */
  if (!validated.forceRefresh) {
    try {
      const cached = await unauthenticatedClient.query(
        api.aiInsightsCache.getCached,
        { normalizedTarget: cacheKey, now: Date.now() },
      );
      if (cached) {
        const insights = cached.insights as AiInsightsResponseBody;
        return NextResponse.json({
          ...insights,
          modelUsed: cached.modelUsed,
          servedFromCache: true,
        } satisfies AiInsightsResponseBody & {
          modelUsed?: string;
          servedFromCache?: boolean;
        });
      }
    } catch {
      /* fall through to live generation */
    }
  }

  const primary =
    process.env.OPENROUTER_MODEL_PRIMARY?.trim() ||
    "mistralai/mistral-small-24b-instruct-2501";
  const fallback =
    process.env.OPENROUTER_MODEL_FALLBACK?.trim() || "openai/gpt-4o-mini";

  const userContent = buildUserPrompt(validated);

  let result: (AiInsightsResponseBody & { modelUsed: string }) | null = null;
  let lastErr: unknown;
  try {
    result = await generateWithModel({
      apiKey,
      model: primary,
      userContent,
      scanMode: validated.scanMode ?? "deep",
    });
  } catch (e) {
    lastErr = e;
  }

  if (!result && fallback && fallback !== primary) {
    try {
      result = await generateWithModel({
        apiKey,
        model: fallback,
        userContent,
        scanMode: validated.scanMode ?? "deep",
      });
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Fallo primario y de respaldo.";
      return NextResponse.json(
        { error: msg },
        { status: 502 },
      );
    }
  }

  if (!result) {
    const msg =
      lastErr instanceof Error ? lastErr.message : "Fallo al generar insights.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const secret = process.env.INSIGHTS_CACHE_WRITE_SECRET?.trim();
  if (secret) {
    try {
      await unauthenticatedClient.mutation(api.aiInsightsCache.setCached, {
        secret,
        normalizedTarget: cacheKey,
        insights: {
          executiveSummary: result.executiveSummary,
          topActions: result.topActions,
          disclaimers: result.disclaimers,
          perFindingInsightsById: result.perFindingInsightsById,
          checklistRowInsightsById: result.checklistRowInsightsById,
        },
        modelUsed: result.modelUsed,
      });
    } catch {
      /* cache write best-effort */
    }
  }

  if (validated.convexScanId) {
    try {
      const authed = createConvexHttpClient(jwt);
      await authed.mutation(api.scans.updateScanInsights, {
        scanId: validated.convexScanId as Id<"scans">,
        aiInsights: {
          executiveSummary: result.executiveSummary,
          topActions: result.topActions,
          disclaimers: result.disclaimers,
          perFindingInsightsById: result.perFindingInsightsById,
          checklistRowInsightsById: result.checklistRowInsightsById,
          modelUsed: result.modelUsed,
        },
      });
    } catch {
      /* persistence best-effort */
    }
  }

  return NextResponse.json({
    ...result,
    servedFromCache: false,
  });
}
