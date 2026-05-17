import {
  buildUserPrompt,
  getInsightsSystemPrompt,
  parseInsightsModelOutput,
} from "@/lib/ai/insights-prompt";
import { callOpenRouterCompletion } from "@/lib/ai/openrouter";
import type {
  AiInsightsRequestBody,
  AiInsightsMinimalFindingInput,
  AiInsightsMinimalModuleInput,
  AiInsightsResponseBody,
} from "@/types/ai-insights";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function parseMinimalFinding(raw: unknown): AiInsightsMinimalFindingInput | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (
    typeof o.id !== "string" ||
    typeof o.module !== "string" ||
    typeof o.severity !== "string" ||
    typeof o.title !== "string" ||
    typeof o.explanation !== "string"
  ) {
    return null;
  }
  return {
    id: o.id,
    module: o.module,
    severity: o.severity,
    title: o.title,
    explanation: o.explanation,
  };
}

function parseMinimalModule(raw: unknown): AiInsightsMinimalModuleInput | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.name !== "string" || typeof o.status !== "string") return null;
  const durationMs =
    typeof o.durationMs === "number" && Number.isFinite(o.durationMs)
      ? o.durationMs
      : undefined;
  const errorMessage =
    typeof o.errorMessage === "string" ? o.errorMessage : undefined;
  return { name: o.name, status: o.status, durationMs, errorMessage };
}

function parseRequestBody(payload: unknown): AiInsightsRequestBody | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;

  const normalizedTarget =
    typeof p.normalizedTarget === "string" ? p.normalizedTarget.trim() : "";
  const inputKind = typeof p.inputKind === "string" ? p.inputKind.trim() : "";
  const totalHostnames =
    typeof p.totalHostnames === "number" && Number.isFinite(p.totalHostnames)
      ? Math.max(0, Math.floor(p.totalHostnames))
      : 0;
  const hostnameSampleShownCount =
    typeof p.hostnameSampleShownCount === "number" &&
    Number.isFinite(p.hostnameSampleShownCount)
      ? Math.max(0, Math.floor(p.hostnameSampleShownCount))
      : 0;

  const rawScanMode =
    typeof p.scanMode === "string" ? p.scanMode.trim().toLowerCase() : "";
  const scanMode: "deep" | "quick" =
    rawScanMode === "quick" ? "quick" : "deep";

  const findingsRaw = p.findings;
  if (!Array.isArray(findingsRaw)) return null;

  const findings: AiInsightsMinimalFindingInput[] = [];
  for (const item of findingsRaw) {
    const f = parseMinimalFinding(item);
    if (f) findings.push(f);
  }

  const modulesRaw = p.modules;
  const modules: AiInsightsMinimalModuleInput[] = [];
  if (Array.isArray(modulesRaw)) {
    for (const item of modulesRaw) {
      const m = parseMinimalModule(item);
      if (m) modules.push(m);
    }
  }

  const checklistRows: NonNullable<AiInsightsRequestBody["checklistRows"]> = [];
  const cr = p.checklistRows;
  if (Array.isArray(cr)) {
    for (const row of cr) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      if (typeof r.id !== "string" || typeof r.label !== "string") continue;
      if (typeof r.status !== "string") continue;
      const detail =
        typeof r.detail === "string" ? r.detail : undefined;
      checklistRows.push({ id: r.id, label: r.label, status: r.status, detail });
    }
  }

  if (!normalizedTarget || !inputKind) {
    return null;
  }

  return {
    normalizedTarget,
    inputKind,
    scanMode,
    totalHostnames,
    hostnameSampleShownCount,
    findings,
    checklistRows:
      checklistRows.length > 0 ? checklistRows : undefined,
    modules,
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

  const validated = parseRequestBody(json);
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
