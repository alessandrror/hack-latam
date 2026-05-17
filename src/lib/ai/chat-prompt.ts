import type { AiInsightsRequestBody, AiInsightsResponseBody } from "@/types/ai-insights";
import type { AiChatMessage } from "@/types/ai-chat";
import type { AiChatResponseBody } from "@/types/ai-chat";
import { DEFENSIVE_ADVISOR_RULES, getScanModeContextBlock } from "./defensive-rules";
import { trimScanSnapshotForChat } from "./parse-scan-snapshot";

const CHAT_JSON_SHAPE = `Output MUST be valid JSON only, no markdown fences, no commentary before or after the JSON object.

JSON shape:
{
  "reply": string (Spanish; use **bold** for emphasis and lines starting with "- " for bullet lists),
  "citedFindingIds": string[] optional (ids from input findings only),
  "citedChecklistIds": string[] optional (checklist row ids from input only),
  "disclaimers": string[] optional (short passive-scan caveats when user asks for certainty)
}`;

export function getChatSystemPrompt(scanMode: "deep" | "quick" = "deep"): string {
  return `${DEFENSIVE_ADVISOR_RULES}
${getScanModeContextBlock(scanMode)}

You are answering follow-up questions about an existing scan snapshot and optional prior structured insights.
- Stay secondary to the structured insights: clarify, reprioritize, verify steps, or handoff bullets for DNS/hosting — do not replace the full report.
- If the user asks for offensive actions, refuse briefly and offer defensive alternatives.
- If the question is unrelated to the scan snapshot, redirect them to ask about their scan results.

${CHAT_JSON_SHAPE}`;
}

export function buildChatUserPrompt(params: {
  snapshot: AiInsightsRequestBody;
  priorInsights?: AiInsightsResponseBody;
  recentMessages: AiChatMessage[];
}): string {
  const trimmed = trimScanSnapshotForChat(params.snapshot);
  const payload = {
    normalizedTarget: trimmed.normalizedTarget,
    inputKind: trimmed.inputKind,
    scanMode: trimmed.scanMode ?? "deep",
    subdomainSummary: {
      totalHostnamesReported: trimmed.totalHostnames,
      hostnameSampleShownCount: trimmed.hostnameSampleShownCount,
      note: "Do not enumerate individual hostnames.",
    },
    modules: trimmed.modules,
    checklistRows: trimmed.checklistRows ?? [],
    findings: trimmed.findings,
  };

  const prior = params.priorInsights
    ? {
        executiveSummary: params.priorInsights.executiveSummary,
        topActions: params.priorInsights.topActions.map((a) => ({
          id: a.id,
          priority: a.priority,
          title: a.title,
          relatedFindingIds: a.relatedFindingIds,
        })),
        disclaimers: params.priorInsights.disclaimers,
      }
    : null;

  const thread = params.recentMessages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  return `Answer the user's latest question using only SCAN_SNAPSHOT_JSON and PRIOR_INSIGHTS_JSON when helpful.

SCAN_SNAPSHOT_JSON:
${JSON.stringify(payload)}

PRIOR_INSIGHTS_JSON:
${prior ? JSON.stringify(prior) : "null"}

CONVERSATION (latest last):
${JSON.stringify(thread)}`;
}

export function parseChatModelOutput(text: string): AiChatResponseBody {
  let s = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```\s*$/m.exec(s);
  if (fence) s = fence[1].trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(s);
  } catch {
    throw new Error("Model output is not valid JSON.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid chat response shape.");
  }

  const p = parsed as Record<string, unknown>;
  if (typeof p.reply !== "string" || !p.reply.trim()) {
    throw new Error("Missing reply.");
  }

  const citedFindingIds =
    Array.isArray(p.citedFindingIds) &&
    p.citedFindingIds.every((x) => typeof x === "string")
      ? (p.citedFindingIds as string[])
      : undefined;

  const citedChecklistIds =
    Array.isArray(p.citedChecklistIds) &&
    p.citedChecklistIds.every((x) => typeof x === "string")
      ? (p.citedChecklistIds as string[])
      : undefined;

  const disclaimers =
    Array.isArray(p.disclaimers) &&
    p.disclaimers.every((x) => typeof x === "string")
      ? (p.disclaimers as string[])
      : undefined;

  return {
    reply: p.reply.trim(),
    citedFindingIds,
    citedChecklistIds,
    disclaimers,
  };
}
