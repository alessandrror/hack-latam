import type { AiChatMessage } from "@/types/ai-chat";

const STORAGE_PREFIX = "hacklatam-ai-chat:";

export function chatSessionStorageKey(
  normalizedTarget: string,
  scanMode: string,
): string {
  return `${STORAGE_PREFIX}${normalizedTarget}:${scanMode}`;
}

export function loadChatMessages(key: string): AiChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: AiChatMessage[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const m = item as Record<string, unknown>;
      if (m.role !== "user" && m.role !== "assistant") continue;
      if (typeof m.content !== "string") continue;
      out.push({ role: m.role, content: m.content });
    }
    return out;
  } catch {
    return [];
  }
}

export function saveChatMessages(key: string, messages: AiChatMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(messages));
  } catch {
    /* quota or private mode */
  }
}

export function clearChatMessages(key: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
