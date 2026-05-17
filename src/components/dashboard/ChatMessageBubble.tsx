"use client";

import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import { ChatMarkdown } from "./ChatMarkdown";

type ChatMessageBubbleProps = {
  role: "user" | "assistant";
  content: string;
  userImageUrl?: string | null;
  userName?: string | null;
};

function ChatAvatar({
  role,
  userImageUrl,
  userName,
}: {
  role: "user" | "assistant";
  userImageUrl?: string | null;
  userName?: string | null;
}) {
  if (role === "assistant") {
    return (
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-950/90 ring-2 ring-sky-500/25 sm:size-10"
        aria-label="Asesor IA"
      >
        <Bot className="size-[1.125rem] text-sky-200 sm:size-5" strokeWidth={2} />
      </div>
    );
  }

  if (userImageUrl) {
    return (
      <img
        src={userImageUrl}
        alt={userName ? `Avatar de ${userName}` : "Tu avatar"}
        width={40}
        height={40}
        className="size-9 shrink-0 rounded-full object-cover ring-2 ring-accent/30 sm:size-10"
      />
    );
  }

  return (
    <div
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted ring-2 ring-border sm:size-10"
      aria-hidden
    >
      <User className="size-4 text-muted-foreground" />
    </div>
  );
}

export function ChatMessageBubble({
  role,
  content,
  userImageUrl,
  userName,
}: ChatMessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex w-full max-w-full items-end gap-2 sm:gap-3",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <ChatAvatar
        role={role}
        userImageUrl={userImageUrl}
        userName={userName}
      />

      <div
        className={cn(
          "min-w-0 flex-1",
          isUser ? "flex justify-end" : "flex justify-start",
        )}
      >
        <p className="sr-only">{isUser ? "Tú" : "Asesor"}</p>
        <div
          className={cn(
            "w-full max-w-full px-3.5 py-2.5 text-sm leading-relaxed shadow-sm sm:px-4 sm:py-3",
            isUser
              ? "rounded-2xl rounded-br-none bg-accent/15 text-foreground"
              : "rounded-2xl rounded-bl-none border border-border bg-background text-foreground",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{content}</p>
          ) : (
            <ChatMarkdown content={content} />
          )}
        </div>
      </div>
    </div>
  );
}

export function ChatTypingBubble() {
  return (
    <div className="flex w-full max-w-full items-end gap-2 sm:gap-3">
      <ChatAvatar role="assistant" />
      <div className="min-w-0 flex-1">
        <div className="w-full max-w-full rounded-2xl rounded-bl-none border border-border bg-background px-4 py-3 text-sm shadow-sm">
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Pensando</span>
            <span className="inline-flex gap-0.5" aria-hidden>
              <span className="animate-bounce [animation-delay:0ms]">.</span>
              <span className="animate-bounce [animation-delay:150ms]">.</span>
              <span className="animate-bounce [animation-delay:300ms]">.</span>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
