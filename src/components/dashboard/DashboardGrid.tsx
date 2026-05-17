import type { ReactNode } from "react";

export function DashboardGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-4 lg:items-start">
      {children}
    </div>
  );
}
