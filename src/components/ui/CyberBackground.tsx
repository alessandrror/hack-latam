import type { ReactNode } from "react";

export function CyberBackground({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-full cyber-grid">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-[120px]" />
        <div className="absolute -right-32 top-1/4 h-[28rem] w-[28rem] rounded-full bg-cyan-500/15 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-violet-600/10 blur-[100px]" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
