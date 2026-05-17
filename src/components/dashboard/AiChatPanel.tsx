"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  chatSessionStorageKey,
  clearChatMessages,
  loadChatMessages,
  saveChatMessages,
} from "@/lib/ai/chat-session-storage";
import type { AiInsightsRequestBody, AiInsightsResponseBody } from "@/types/ai-insights";
import {
  AI_CHAT_LIMITS,
  type AiChatMessage,
  type AiChatResponseBody,
} from "@/types/ai-chat";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildSuggestedChatPrompts } from "@/lib/ai/chat-suggested-prompts";
import { ChatMessageBubble, ChatTypingBubble } from "./ChatMessageBubble";

type AiChatPanelProps = {
  scanSnapshot: AiInsightsRequestBody;
  priorInsights: AiInsightsResponseBody;
  isSignedIn: boolean;
  authLoaded: boolean;
  onCitationClick?: (findingId: string) => void;
  className?: string;
};

function isAiChatResponseBody(x: unknown): x is AiChatResponseBody {
  if (!x || typeof x !== "object") return false;
  return typeof (x as { reply: unknown }).reply === "string";
}

export function AiChatPanel({
  scanSnapshot,
  priorInsights,
  isSignedIn,
  authLoaded,
  onCitationClick,
  className,
}: AiChatPanelProps) {
  const { user } = useUser();
  const userImageUrl = user?.imageUrl ?? null;
  const userName =
    user?.fullName?.trim() ||
    user?.firstName?.trim() ||
    user?.username?.trim() ||
    null;

  const storageKey = useMemo(
    () =>
      chatSessionStorageKey(
        scanSnapshot.normalizedTarget,
        scanSnapshot.scanMode ?? "deep",
      ),
    [scanSnapshot.normalizedTarget, scanSnapshot.scanMode],
  );

  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [lastCitedFindingIds, setLastCitedFindingIds] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setMessages(loadChatMessages(storageKey));
    });
  }, [storageKey]);

  useEffect(() => {
    saveChatMessages(storageKey, messages);
  }, [messages, storageKey]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const suggestedChips = useMemo(
    () =>
      buildSuggestedChatPrompts({
        priorInsights,
        scanSnapshot,
      }),
    [priorInsights, scanSnapshot],
  );

  const userTurnCount = messages.filter((m) => m.role === "user").length;
  const atTurnLimit = userTurnCount >= AI_CHAT_LIMITS.maxTurnsPerSession;
  const freeTextUnlocked = userTurnCount > 0;

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading || atTurnLimit) return;

      const userMsg: AiChatMessage = { role: "user", content: trimmed };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setInput("");
      setError(null);
      setLoading(true);

      try {
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scanSnapshot,
            priorInsights,
            messages: nextMessages,
          }),
        });
        const payload: unknown = await response.json();
        if (!response.ok) {
          const message =
            typeof payload === "object" &&
            payload !== null &&
            "error" in payload &&
            typeof (payload as { error: unknown }).error === "string"
              ? (payload as { error: string }).error
              : `Error de chat (${response.status}).`;
          setError(message);
          setMessages(messages);
          return;
        }
        if (!isAiChatResponseBody(payload)) {
          setError("Respuesta de chat inválida.");
          setMessages(messages);
          return;
        }
        const assistantMsg: AiChatMessage = {
          role: "assistant",
          content: payload.reply,
        };
        setLastCitedFindingIds(payload.citedFindingIds ?? []);
        setMessages([...nextMessages, assistantMsg]);
      } catch {
        setError("Error de red — inténtalo de nuevo.");
        setMessages(messages);
      } finally {
        setLoading(false);
      }
    },
    [atTurnLimit, loading, messages, priorInsights, scanSnapshot],
  );

  const shellClass = cn(
    "flex h-full w-full min-h-0 max-h-full flex-col overflow-hidden rounded-lg border border-border bg-muted/20",
    className,
  );

  if (!authLoaded) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        Cargando sesión…
      </p>
    );
  }

  if (!isSignedIn) {
    return (
      <div
        className={cn(
          shellClass,
          "justify-center p-4 text-sm text-muted-foreground",
        )}
      >
        <p>Inicia sesión para hacer preguntas de seguimiento sobre este escaneo.</p>
        <SignInButton mode="modal">
          <Button type="button" className="mt-3" size="sm">
            Iniciar sesión
          </Button>
        </SignInButton>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <div className="shrink-0 border-b border-border px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Refinar con preguntas
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Elige una opción sugerida para empezar; luego podrás escribir libremente.
        </p>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 w-full flex-1 space-y-4 overflow-y-auto overscroll-y-contain px-3 py-4 pb-5 sm:px-5"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground">
            Sin mensajes aún. Elige una opción sugerida abajo para iniciar la
            conversación.
          </p>
        ) : (
          messages.map((msg, idx) => (
            <ChatMessageBubble
              key={`${msg.role}-${idx}-${msg.content.slice(0, 24)}`}
              role={msg.role}
              content={msg.content}
              userImageUrl={userImageUrl}
              userName={userName}
            />
          ))
        )}
        {loading ? <ChatTypingBubble /> : null}
      </div>

      <div className="shrink-0 border-t border-border bg-muted/30">
        {error ? (
          <p className="px-4 pt-2 text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}

        {atTurnLimit ? (
          <p className="px-4 pt-2 text-xs text-amber-800">
            Límite de {AI_CHAT_LIMITS.maxTurnsPerSession} preguntas por sesión.{" "}
            <button
              type="button"
              className="underline"
              onClick={() => {
                clearChatMessages(storageKey);
                setMessages([]);
                setError(null);
                setLastCitedFindingIds([]);
              }}
            >
              Reiniciar conversación
            </button>
          </p>
        ) : null}

        {lastCitedFindingIds.length > 0 && onCitationClick ? (
          <div className="border-b border-border px-4 py-2">
            <CitationHints
              citedIds={lastCitedFindingIds}
              findings={scanSnapshot.findings}
              onCitationClick={onCitationClick}
            />
          </div>
        ) : null}

        <div className="space-y-2 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Preguntas sugeridas para este escaneo
          </p>
          <div
            ref={chipsRef}
            className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border"
            role="list"
            aria-label="Preguntas sugeridas"
          >
            {suggestedChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                role="listitem"
                disabled={loading || atTurnLimit}
                onClick={() => void sendMessage(chip.prompt)}
                title={chip.prompt}
                className="shrink-0 snap-start whitespace-nowrap rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent hover:bg-accent/5 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {chip.label}
              </button>
            ))}
          </div>

          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage(input);
            }}
          >
            <label htmlFor="ai-chat-input" className="sr-only">
              Pregunta de seguimiento
            </label>
            <input
              id="ai-chat-input"
              value={input}
              onChange={(e) =>
                setInput(
                  e.target.value.slice(0, AI_CHAT_LIMITS.maxMessageLength),
                )
              }
              placeholder={
                freeTextUnlocked
                  ? "Escribe tu pregunta…"
                  : "Elige una opción sugerida para desbloquear"
              }
              disabled={loading || atTurnLimit || !freeTextUnlocked}
              maxLength={AI_CHAT_LIMITS.maxMessageLength}
              className="min-h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Button
              type="submit"
              disabled={
                loading || atTurnLimit || !freeTextUnlocked || !input.trim()
              }
              className="min-h-10 shrink-0"
              size="sm"
            >
              Enviar
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function CitationHints({
  citedIds,
  findings,
  onCitationClick,
}: {
  citedIds: string[];
  findings: AiInsightsRequestBody["findings"];
  onCitationClick: (findingId: string) => void;
}) {
  const cited = findings.filter((f) => citedIds.includes(f.id));

  if (cited.length === 0) return null;

  return (
    <p className="text-xs text-muted-foreground">
      Hallazgos mencionados:{" "}
      {cited.map((f, i) => (
        <span key={f.id}>
          {i > 0 ? ", " : null}
          <button
            type="button"
            className="text-accent underline"
            onClick={() => onCitationClick(f.id)}
          >
            {f.title}
          </button>
        </span>
      ))}
    </p>
  );
}
