import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TopNavProps = {
  target: string;
  onTargetChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  error: string | null;
  onNewScan?: () => void;
  inputId?: string;
};

export function TopNav({
  target,
  onTargetChange,
  onSubmit,
  loading,
  error,
  onNewScan,
  inputId = "target-nav",
}: TopNavProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
        <div className="flex min-w-0 shrink-0 items-center gap-3">
          <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-wider text-slate-400">
              Hack LATAM
            </p>
            <p className="truncate text-sm font-medium text-slate-100">
              Attack surface dashboard
            </p>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-2"
        >
          <label htmlFor={inputId} className="sr-only">
            Target domain or URL
          </label>
          <Input
            id={inputId}
            name="target"
            value={target}
            onChange={(e) => onTargetChange(e.target.value)}
            placeholder="Domain or URL"
            className="min-h-10 min-w-0 flex-1 rounded-lg border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-50 ring-emerald-500/30 outline-none placeholder:text-slate-500 focus-visible:border-emerald-500/40 focus-visible:ring-2 dark:bg-slate-900"
            autoComplete="off"
            disabled={loading}
          />
          <div className="flex shrink-0 gap-2">
            <Button
              type="submit"
              disabled={loading || !target.trim()}
              variant="outline"
              className="min-h-10 cursor-pointer border-emerald-600/50 bg-emerald-600 text-slate-950 hover:bg-emerald-500 hover:text-slate-950 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              {loading ? "Scanning…" : "Scan"}
            </Button>
            {onNewScan ? (
              <Button
                type="button"
                variant="outline"
                onClick={onNewScan}
                className="min-h-10 border-slate-600 bg-transparent text-slate-300 hover:border-slate-500 hover:bg-slate-800/80 hover:text-slate-200 dark:bg-transparent dark:hover:bg-slate-800/80"
              >
                New scan
              </Button>
            ) : null}
          </div>
        </form>
      </div>
      {error ? (
        <div
          className="border-t border-red-500/20 bg-red-950/40 px-4 py-2 text-sm text-red-300 sm:px-6"
          role="alert"
        >
          {error}
        </div>
      ) : null}
    </header>
  );
}
