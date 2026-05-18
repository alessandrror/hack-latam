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

export async function callOpenRouterCompletionStream(options: {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  /** Request timeout */
  timeoutMs?: number;
  /**
   * Called with incremental content deltas from OpenRouter.
   * Note: when OpenRouter is asked to return JSON-only content,
   * these deltas are still pieces of the JSON string.
   */
  onDelta: (delta: string) => void;
}): Promise<OpenRouterCompletionResult> {
  const { apiKey, model, messages, timeoutMs = 60_000, onDelta } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const decoder = new TextDecoder("utf-8");
  let rawText = "";
  let usedModel = model;
  let started = false;

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
        stream: true,
      }),
      signal: controller.signal,
    });

    if (!res.ok || !res.body) {
      const data: unknown = await res.json().catch(() => ({}));
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

    const reader = res.body.getReader();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      while (true) {
        const sepIdx = buffer.indexOf("\n\n");
        if (sepIdx === -1) break;

        const rawEvent = buffer.slice(0, sepIdx);
        buffer = buffer.slice(sepIdx + 2);

        const dataLines = rawEvent
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.startsWith("data:"));

        for (const line of dataLines) {
          const dataStr = line.slice("data:".length).trim();
          if (!dataStr) continue;
          if (dataStr === "[DONE]") break;

          let parsed: unknown;
          try {
            parsed = JSON.parse(dataStr);
          } catch {
            continue;
          }

          if (!started) {
            started = true;
            if (
              typeof parsed === "object" &&
              parsed !== null &&
              "model" in parsed &&
              typeof (parsed as { model?: unknown }).model === "string"
            ) {
              usedModel = (parsed as { model: string }).model;
            }
          }

          if (
            typeof parsed === "object" &&
            parsed !== null &&
            "choices" in parsed &&
            Array.isArray((parsed as { choices: unknown }).choices)
          ) {
            const choices = (parsed as { choices: unknown[] }).choices;
            const choice0 = choices[0];
            if (choice0 && typeof choice0 === "object") {
              const delta = (choice0 as { delta?: unknown }).delta;
              const deltaContent = delta && typeof delta === "object"
                ? (delta as { content?: unknown }).content
                : undefined;
              if (
                typeof deltaContent === "string" &&
                deltaContent.length > 0
              ) {
                rawText += deltaContent;
                onDelta(deltaContent);
              }
            }
          }
        }
      }
    }

    return { rawText, model: usedModel };
  } finally {
    clearTimeout(timer);
  }
}
