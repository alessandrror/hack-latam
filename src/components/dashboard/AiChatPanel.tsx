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
import { SignInButton } from "@clerk/nextjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatMarkdown } from "./ChatMarkdown";

const SUGGESTED_CHIPS: { label: string; prompt: string }[] = [
  {
    label: "Explicar críticos",
    prompt:
      "Explica en español los hallazgos críticos y medios de este escaneo y por qué importan para una PYME.",
  },
  {
    label: "Qué verificar primero",
    prompt:
      "Dado mi tiempo limitado, ¿qué debería verificar primero esta semana? Cita ids de hallazgos.",
  },
  {
    label: "Handoff DNS",
    prompt:
      "Redacta bullets cortos que pueda enviar a mi proveedor DNS/hosting para corregir SPF/DMARC/TLS según este escaneo.",
  },
  {
    label: "Alcance del scan",
    prompt:
      "¿Qué no cubrió este escaneo pasivo y qué no debo asumir como seguro?",
  },
];

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
    "flex h-full max-h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-muted/20",
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
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-y-contain px-4 py-3"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Sin mensajes aún. Desliza las opciones de abajo para iniciar la
            conversación.
          </p>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={`${msg.role}-${idx}-${msg.content.slice(0, 24)}`}
              className={
                msg.role === "user"
                  ? "ml-4 rounded-lg bg-accent/10 px-3 py-2"
                  : "mr-1 rounded-lg border border-border bg-background px-3 py-2"
              }
            >
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {msg.role === "user" ? "Tú" : "Asesor"}
              </p>
              {msg.role === "assistant" ? (
                <ChatMarkdown content={msg.content} />
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {msg.content}
                </p>
              )}
            </div>
          ))
        )}
        {loading ? (
          <p className="text-xs text-muted-foreground">Pensando…</p>
        ) : null}
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
            Preguntas sugeridas
          </p>
          <div
            ref={chipsRef}
            className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border"
            role="list"
          >
            {SUGGESTED_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                role="listitem"
                disabled={loading || atTurnLimit}
                onClick={() => void sendMessage(chip.prompt)}
                className="shrink-0 snap-start rounded-full border border-border bg-background px-4 py-2 text-sm font-medium whitespace-nowrap text-foreground transition hover:border-accent hover:bg-accent/5 disabled:cursor-not-allowed disabled:opacity-45"
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
