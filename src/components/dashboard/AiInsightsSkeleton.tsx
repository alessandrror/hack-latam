function InsightLineSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-3 motion-safe:animate-pulse rounded bg-slate-700/70 ${className}`}
      aria-hidden
    />
  );
}

export function AiInsightsSkeleton() {
  return (
    <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="h-4 w-40 motion-safe:animate-pulse rounded bg-slate-700/80" />
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
        Generating insights
      </p>
      <InsightLineSkeleton className="mt-4 w-full" />
      <InsightLineSkeleton className="mt-2 max-w-[92%]" />
      <InsightLineSkeleton className="mt-2 w-full" />
      <div className="mt-6 space-y-2">
        <div className="h-14 motion-safe:animate-pulse rounded-lg bg-slate-800/80" />
        <div className="h-14 motion-safe:animate-pulse rounded-lg bg-slate-800/70" />
        <div className="h-12 motion-safe:animate-pulse rounded-lg bg-slate-800/60" />
      </div>
    </div>
  );
}
