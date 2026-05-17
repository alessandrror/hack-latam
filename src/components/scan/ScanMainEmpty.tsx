"use client";

import type { ReactNode } from "react";

/**
 * App-style start surface: quiet greeting + centered hero width for the scan form.
 */
export function ScanMainStart({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col justify-center px-4 py-8 sm:px-8 sm:py-12 lg:px-12"
      aria-live="polite"
    >
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <p className="text-center text-xl font-normal tracking-tight text-foreground sm:text-2xl">
          Listo cuando quieras
        </p>
        {children}
      </div>
    </div>
  );
}
