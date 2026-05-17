import type { ReactNode } from "react";

export function GradientText({
  children,
  as: Tag = "span",
  className = "",
}: {
  children: ReactNode;
  as?: "span" | "h1" | "h2" | "h3";
  className?: string;
}) {
  return <Tag className={`text-gradient-neon ${className}`}>{children}</Tag>;
}
