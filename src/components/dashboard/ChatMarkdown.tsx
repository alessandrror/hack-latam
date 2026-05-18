"use client";

import { cn } from "@/lib/utils";
import { Fragment, type ReactNode } from "react";

const INLINE_CODE_CLASS =
  "rounded-md border border-border/80 bg-muted/80 px-1.5 py-0.5 font-mono text-[0.8125rem] font-medium text-foreground";

/** Inline: `code`, **bold**, *italic* */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /(`[^`\n]+`|\*\*[^*]+\*\*|\*[^*\n]+\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(
        <Fragment key={`${keyPrefix}-t-${i++}`}>
          {text.slice(last, match.index)}
        </Fragment>,
      );
    }

    const token = match[0];
    if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(
        <code key={`${keyPrefix}-c-${i++}`} className={INLINE_CODE_CLASS}>
          {token.slice(1, -1)}
        </code>,
      );
    } else if (
      token.startsWith("**") &&
      token.endsWith("**") &&
      token.length > 4
    ) {
      nodes.push(
        <strong
          key={`${keyPrefix}-b-${i++}`}
          className="font-semibold text-foreground"
        >
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (
      token.startsWith("*") &&
      token.endsWith("*") &&
      token.length > 2
    ) {
      nodes.push(
        <em key={`${keyPrefix}-i-${i++}`} className="text-foreground/90">
          {token.slice(1, -1)}
        </em>,
      );
    } else {
      nodes.push(<Fragment key={`${keyPrefix}-r-${i++}`}>{token}</Fragment>);
    }
    last = match.index + token.length;
  }

  if (last < text.length) {
    nodes.push(
      <Fragment key={`${keyPrefix}-t-${i++}`}>{text.slice(last)}</Fragment>,
    );
  }

  return nodes.length > 0 ? nodes : [text];
}

type Block =
  | { type: "h"; level: 1 | 2 | 3; text: string }
  | { type: "p"; lines: string[] }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "code"; content: string }
  | { type: "hr" };

function normalizeChatMarkdown(raw: string): string {
  let s = raw.trim();
  const fence = /^```(?:json|markdown|md)?\s*([\s\S]*?)```\s*$/i.exec(s);
  if (fence) s = fence[1].trim();
  return s;
}

function parseBlocks(content: string): Block[] {
  const lines = content.split(/\n/);
  const blocks: Block[] = [];
  let para: string[] = [];
  let ul: string[] = [];
  let ol: string[] = [];
  let codeLines: string[] | null = null;

  const flushPara = () => {
    if (para.length > 0) {
      blocks.push({ type: "p", lines: [...para] });
      para = [];
    }
  };
  const flushUl = () => {
    if (ul.length > 0) {
      blocks.push({ type: "ul", items: [...ul] });
      ul = [];
    }
  };
  const flushOl = () => {
    if (ol.length > 0) {
      blocks.push({ type: "ol", items: [...ol] });
      ol = [];
    }
  };
  const flushLists = () => {
    flushUl();
    flushOl();
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (codeLines !== null) {
      if (trimmed.startsWith("```")) {
        blocks.push({ type: "code", content: codeLines.join("\n") });
        codeLines = null;
      } else {
        codeLines.push(line);
      }
      continue;
    }

    if (trimmed.startsWith("```")) {
      flushLists();
      flushPara();
      codeLines = [];
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      flushLists();
      flushPara();
      blocks.push({ type: "hr" });
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushLists();
      flushPara();
      blocks.push({
        type: "h",
        level: heading[1].length as 1 | 2 | 3,
        text: heading[2],
      });
      continue;
    }

    const ordered = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (ordered) {
      flushPara();
      flushUl();
      ol.push(ordered[1]);
      continue;
    }

    const bullet = trimmed.match(/^[-*•]\s+(.+)$/);
    if (bullet) {
      flushPara();
      flushOl();
      ul.push(bullet[1]);
      continue;
    }

    flushLists();
    if (trimmed === "") {
      flushPara();
      continue;
    }
    para.push(trimmed);
  }

  if (codeLines !== null) {
    blocks.push({ type: "code", content: codeLines.join("\n") });
  }
  flushLists();
  flushPara();
  return blocks;
}

function headingClass(level: 1 | 2 | 3): string {
  switch (level) {
    case 1:
      return "text-base font-semibold text-foreground";
    case 2:
      return "text-sm font-semibold text-foreground";
    case 3:
      return "text-sm font-medium text-foreground";
    default:
      return "text-sm font-semibold text-foreground";
  }
}

export function ChatMarkdown({ content }: { content: string }) {
  const normalized = normalizeChatMarkdown(content);
  const blocks = parseBlocks(normalized);

  if (blocks.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-foreground">
        {renderInline(normalized, "fallback")}
      </p>
    );
  }

  return (
    <div className="chat-markdown w-full space-y-2.5 text-sm leading-relaxed text-foreground">
      {blocks.map((block, bi) => {
        if (block.type === "h") {
          const Tag = block.level === 1 ? "h3" : block.level === 2 ? "h4" : "h5";
          return (
            <Tag key={bi} className={cn(headingClass(block.level), "mt-0.5 first:mt-0")}>
              {renderInline(block.text, `h-${bi}`)}
            </Tag>
          );
        }

        if (block.type === "ul") {
          return (
            <ul
              key={bi}
              className="list-disc space-y-1.5 pl-5 marker:text-muted-foreground"
            >
              {block.items.map((item, ii) => (
                <li key={ii} className="pl-0.5">
                  {renderInline(item, `ul-${bi}-${ii}`)}
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === "ol") {
          return (
            <ol
              key={bi}
              className="list-decimal space-y-1.5 pl-5 marker:font-medium marker:text-muted-foreground"
            >
              {block.items.map((item, ii) => (
                <li key={ii} className="pl-0.5">
                  {renderInline(item, `ol-${bi}-${ii}`)}
                </li>
              ))}
            </ol>
          );
        }

        if (block.type === "code") {
          return (
            <pre
              key={bi}
              className="overflow-x-auto rounded-lg border border-border bg-muted/60 p-3"
            >
              <code className="block font-mono text-xs leading-relaxed whitespace-pre-wrap break-words text-foreground">
                {block.content}
              </code>
            </pre>
          );
        }

        if (block.type === "hr") {
          return (
            <hr key={bi} className="border-border/60" aria-hidden />
          );
        }

        return (
          <p key={bi} className="text-foreground/95">
            {block.lines.map((line, li) => (
              <Fragment key={li}>
                {li > 0 ? <br /> : null}
                {renderInline(line, `p-${bi}-${li}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
