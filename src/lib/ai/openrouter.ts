/**
 * OpenRouter Chat Completions (OpenAI-compatible) with Mistral-first, then fallback.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface OpenRouterCompletionResult {
  rawText: string;
  model: string;
}

export async function callOpenRouterCompletion(options: {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  /** Request timeout */
  timeoutMs?: number;
}): Promise<OpenRouterCompletionResult> {
  const { apiKey, model, messages, timeoutMs = 60_000 } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(process.env.OPENROUTER_HTTP_REFERRER && {
          Referer: process.env.OPENROUTER_HTTP_REFERRER,
        }),
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    const data: unknown = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg =
        typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof (data as { error: unknown }).error === "object" &&
        (data as { error: { message?: unknown } }).error !== null
          ? String(
              (data as { error: { message?: string } }).error.message ??
                JSON.stringify(data),
            )
          : JSON.stringify(data);
      throw new Error(`OpenRouter ${res.status}: ${errMsg}`);
    }

    const choice =
      typeof data === "object" &&
      data !== null &&
      "choices" in data &&
      Array.isArray((data as { choices: unknown }).choices) &&
      (data as { choices: Array<{ message?: { content?: unknown } }> }).choices[
        0
      ]?.message?.content !== undefined
        ? (data as { choices: Array<{ message?: { content?: string } }> })
            .choices[0].message!.content!
        : null;

    if (typeof choice !== "string" || !choice.trim()) {
      throw new Error("Empty model response.");
    }

    const used =
      typeof data === "object" &&
      data !== null &&
      "model" in data &&
      typeof (data as { model: unknown }).model === "string"
        ? (data as { model: string }).model
        : model;

    return { rawText: choice, model: used };
  } finally {
    clearTimeout(timer);
  }
}
