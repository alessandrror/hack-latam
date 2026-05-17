function ColumnSkeleton({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="h-4 w-32 motion-safe:animate-pulse rounded bg-slate-700/80" />
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <div className="space-y-2">
        <div className="h-14 motion-safe:animate-pulse rounded-lg bg-slate-800/90" />
        <div className="h-14 motion-safe:animate-pulse rounded-lg bg-slate-800/90" />
        <div className="h-14 motion-safe:animate-pulse rounded-lg bg-slate-800/70" />
      </div>
      <div className="mt-2 h-32 motion-safe:animate-pulse rounded-lg bg-slate-800/60" />
    </div>
  );
}

export function SkeletonGrid() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ColumnSkeleton title="Loading assets" />
      <ColumnSkeleton title="Loading risks" />
      <ColumnSkeleton title="Loading checklist" />
    </div>
  );
}
