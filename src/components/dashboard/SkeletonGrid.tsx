export type ScanLoadingSkeletonProps = {
  showHeading?: boolean;
  domainLabel?: string;
};

export function ScanLoadingSkeleton({
  showHeading = true,
  domainLabel,
}: ScanLoadingSkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="rounded-xl border border-border bg-card p-6 shadow-sm"
    >
      {showHeading ? (
        <>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Analizando (pasivo)
          </p>
          <p className="mt-3 font-mono text-sm font-medium break-all text-foreground">
            {domainLabel?.trim() || "—"}
          </p>
          <div className="mt-8 space-y-4">
            <div className="h-3 motion-safe:animate-pulse rounded bg-muted" />
            <div className="h-3 w-11/12 max-w-xl motion-safe:animate-pulse rounded bg-muted" />
            <div className="h-3 w-10/12 max-w-lg motion-safe:animate-pulse rounded bg-muted" />
            <div className="mt-6 h-24 motion-safe:animate-pulse rounded-lg bg-muted" />
            <div className="h-20 motion-safe:animate-pulse rounded-lg bg-muted" />
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Cuando termine la solicitud pasiva aparecerán resultados en Activos,
            Hallazgos, Checklist y (si los generas) IA.
          </p>
        </>
      ) : (
        <>
          <div className="space-y-4">
            <div className="h-3 motion-safe:animate-pulse rounded bg-muted" />
            <div className="h-3 w-11/12 max-w-xl motion-safe:animate-pulse rounded bg-muted" />
            <div className="h-3 w-10/12 max-w-lg motion-safe:animate-pulse rounded bg-muted" />
          </div>
          <div className="mt-6 h-32 motion-safe:animate-pulse rounded-lg bg-muted" />
          <p className="mt-4 text-xs text-muted-foreground">
            Esperando el último resultado pasivo del dominio que enviaste…
          </p>
        </>
      )}
    </div>
  );
}

/** @deprecated Prefer `ScanLoadingSkeleton`; kept for existing imports. */
export { ScanLoadingSkeleton as SkeletonGrid };
