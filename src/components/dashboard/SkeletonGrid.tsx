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
      className="neon-panel rounded-xl border-cyan-500/20 p-6 shadow-none ring-0"
    >
      {showHeading ? (
        <>
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-500/80">
            Escaneando
          </p>
          <p className="mt-3 font-mono text-sm font-medium break-all text-cyan-300/95">
            {domainLabel?.trim() || "—"}
          </p>
          <div className="mt-8 space-y-4">
            <div className="h-3 motion-safe:animate-pulse rounded bg-slate-800/95" />
            <div className="h-3 w-11/12 max-w-xl motion-safe:animate-pulse rounded bg-slate-800/85" />
            <div className="h-3 w-10/12 max-w-lg motion-safe:animate-pulse rounded bg-slate-800/70" />
            <div className="mt-6 h-24 motion-safe:animate-pulse rounded-lg bg-slate-800/60" />
            <div className="h-20 motion-safe:animate-pulse rounded-lg bg-slate-800/50" />
          </div>
          <p className="mt-6 text-xs text-slate-500">
            Tus resultados aparecerán en las pestañas Activos, Hallazgos,
            Checklist e IA cuando termine la pasada pasiva.
          </p>
        </>
      ) : (
        <>
          <div className="space-y-4">
            <div className="h-3 motion-safe:animate-pulse rounded bg-slate-800/95" />
            <div className="h-3 w-11/12 max-w-xl motion-safe:animate-pulse rounded bg-slate-800/85" />
            <div className="h-3 w-10/12 max-w-lg motion-safe:animate-pulse rounded bg-slate-800/70" />
          </div>
          <div className="mt-6 h-32 motion-safe:animate-pulse rounded-lg bg-slate-800/60" />
          <p className="mt-4 text-xs text-slate-500">
            Esperando reconocimiento pasivo sobre el objetivo anterior…
          </p>
        </>
      )}
    </div>
  );
}

/** @deprecated Prefer `ScanLoadingSkeleton`; kept for existing imports. */
export { ScanLoadingSkeleton as SkeletonGrid };
