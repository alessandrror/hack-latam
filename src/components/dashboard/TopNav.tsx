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
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
        <div className="flex min-w-0 shrink-0 items-center gap-3">
          <div className="h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Hack LATAM
            </p>
            <p className="truncate text-sm font-medium text-foreground">
              Panel de huella pasiva
            </p>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-2"
        >
          <label htmlFor={inputId} className="sr-only">
            Dominio o URL
          </label>
          <Input
            id={inputId}
            name="target"
            value={target}
            onChange={(e) => onTargetChange(e.target.value)}
            placeholder="example.com o URL"
            className="min-h-10 min-w-0 flex-1 rounded-lg border-input bg-background px-3 py-2 font-mono text-sm"
            autoComplete="off"
            disabled={loading}
          />
          <div className="flex shrink-0 gap-2">
            <Button
              type="submit"
              disabled={loading || !target.trim()}
              className="min-h-10 cursor-pointer"
            >
              {loading ? "Analizando…" : "Analizar"}
            </Button>
            {onNewScan ? (
              <Button
                type="button"
                variant="outline"
                onClick={onNewScan}
                className="min-h-10"
              >
                Nuevo análisis
              </Button>
            ) : null}
          </div>
        </form>
      </div>
      {error ? (
        <div
          className="border-t border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800 sm:px-6"
          role="alert"
        >
          {error}
        </div>
      ) : null}
    </header>
  );
}
