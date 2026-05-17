import type { AiChatRequestBody, AiChatResponseBody } from "@/types/ai-chat";

export const CHAT_SYSTEM_PROMPT = `Eres un asistente de refinamiento para operadoras de PYME. Responde siempre en ESPAÑOL.

Basa tus respuestas únicamente en INPUT_JSON (instantánea del escaneo) y en PRIOR_INSIGHTS_JSON si está presente.
- Prohibido explotación o acceso no autorizado; solo pasos defensivos de remediación y verificación humana.
- Si no hay datos suficientes en el JSON, dilo y sugiere qué comprobar en el panel sin inventar hallazgos.
- Para alineación rápida vs profunda: si scanSnapshot.scanMode es "quick", no afirmes cobertura completa de subdominios ni checklist completo.
- Cuando cites hallazgos, incluye sus ids en citedFindingIds.

Salida: SOLO un objeto JSON válido, sin fences markdown ni texto adicional.

Forma JSON:
{
  "reply": string,
  "citedFindingIds": string[] (opcional),
  "disclaimers": string[] (opcional)
}`;

export function buildChatUserContent(body: AiChatRequestBody): string {
  const thread = body.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  return `PRIOR_INSIGHTS_JSON:
${JSON.stringify(body.priorInsights)}

INPUT_JSON:
${JSON.stringify(body.scanSnapshot)}

THREAD_JSON:
${JSON.stringify(thread)}

La última entrada con "role":"user" es la pregunta actual. Devuelve solo el objeto JSON con reply (y opcionales) según el system prompt.`;
}

export function parseChatModelOutput(text: string): AiChatResponseBody {
  let s = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```\s*$/m.exec(s);
  if (fence) s = fence[1].trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(s);
  } catch {
    throw new Error("La salida del modelo no es JSON válido.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("JSON inválido.");
  }

  const o = parsed as Record<string, unknown>;
  if (typeof o.reply !== "string" || !o.reply.trim()) {
    throw new Error("Falta reply.");
  }

  const cited =
    Array.isArray(o.citedFindingIds) &&
    o.citedFindingIds.every((x) => typeof x === "string")
      ? (o.citedFindingIds as string[])
      : undefined;

  const disclaimers =
    Array.isArray(o.disclaimers) &&
    o.disclaimers.every((x) => typeof x === "string")
      ? (o.disclaimers as string[]).filter((x) => x.trim().length > 0)
      : undefined;

  return {
    reply: o.reply,
    ...(cited?.length ? { citedFindingIds: cited } : {}),
    ...(disclaimers?.length ? { disclaimers } : {}),
  };
}
