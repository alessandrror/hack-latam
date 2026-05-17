"use client";

import { Fragment, type ReactNode } from "react";

/** Inline **bold** segments (no HTML). */
function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

type Block =
  | { type: "p"; lines: string[] }
  | { type: "ul"; items: string[] };

function parseBlocks(content: string): Block[] {
  const lines = content.split(/\n/);
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: string[] = [];

  const flushPara = () => {
    if (para.length > 0) {
      blocks.push({ type: "p", lines: [...para] });
      para = [];
    }
  };
  const flushList = () => {
    if (list.length > 0) {
      blocks.push({ type: "ul", items: [...list] });
      list = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      flushPara();
      list.push(bullet[1]);
      continue;
    }
    flushList();
    if (trimmed === "") {
      flushPara();
      continue;
    }
    para.push(trimmed);
  }
  flushList();
  flushPara();
  return blocks;
}

export function ChatMarkdown({ content }: { content: string }) {
  const blocks = parseBlocks(content);

  if (blocks.length === 0) {
    return <p className="text-sm leading-relaxed text-foreground">{content}</p>;
  }

  return (
    <div className="w-full space-y-2 text-sm leading-relaxed text-foreground">
      {blocks.map((block, bi) => {
        if (block.type === "ul") {
          return (
            <ul
              key={bi}
              className="list-disc space-y-1 pl-4 text-foreground marker:text-muted-foreground"
            >
              {block.items.map((item, ii) => (
                <li key={ii}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={bi}>
            {block.lines.map((line, li) => (
              <Fragment key={li}>
                {li > 0 ? <br /> : null}
                {renderInline(line)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
