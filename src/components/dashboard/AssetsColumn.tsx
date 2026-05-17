import { MODULE_DISPLAY_ORDER } from "@/lib/dashboard/findings";
import type { ScanModuleResult } from "@/types/scan";

function moduleStatusDot(status: ScanModuleResult["status"]): string {
  switch (status) {
    case "ok":
      return "bg-emerald-500";
    case "error":
      return "bg-red-500";
    case "skipped":
      return "bg-amber-500";
    default: {
      const _x: never = status;
      return _x;
    }
  }
}

type AssetsColumnProps = {
  displayTarget: string;
  normalizedTarget?: string;
  inputKind?: string;
  modules: ScanModuleResult[];
  hostnames: string[];
  totalHostnames: number;
};

function orderedModules(modules: ScanModuleResult[]): ScanModuleResult[] {
  const byName = new Map(modules.map((m) => [m.name, m]));
  const out: ScanModuleResult[] = [];
  const seen = new Set<string>();
  for (const name of MODULE_DISPLAY_ORDER) {
    const m = byName.get(name);
    if (m) {
      out.push(m);
      seen.add(m.name);
    }
  }
  for (const m of modules) {
    if (!seen.has(m.name)) out.push(m);
  }
  return out;
}

export function AssetsColumn({
  displayTarget,
  normalizedTarget,
  inputKind,
  modules,
  hostnames,
  totalHostnames,
}: AssetsColumnProps) {
  const list = orderedModules(modules);

  return (
    <section className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-black/10">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Assets &amp; state
      </h2>
      <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3">
        <p className="text-xs text-slate-500">Target</p>
        <p className="mt-1 font-mono text-sm font-medium break-all text-emerald-400/95">
          {displayTarget || "—"}
        </p>
        {normalizedTarget ? (
          <p className="mt-2 text-xs text-slate-500">
            Normalized:{" "}
            <span className="font-mono text-slate-300">{normalizedTarget}</span>
            {inputKind ? (
              <span className="text-slate-600"> · {inputKind}</span>
            ) : null}
          </p>
        ) : null}
      </div>

      <h3 className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Modules
      </h3>
      {list.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">
          No module results yet — the scan may have failed or not finished.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {list.map((module) => (
            <li
              key={module.name}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-800/80 bg-slate-950/30 px-3 py-2.5 text-sm"
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${moduleStatusDot(module.status)}`}
                title={module.status}
                aria-hidden
              />
              <span className="font-mono text-slate-200">{module.name}</span>
              <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-xs font-medium uppercase text-slate-300">
                {module.status}
              </span>
              {typeof module.durationMs === "number" ? (
                <span className="text-xs text-slate-500 tabular-nums">
                  {module.durationMs} ms
                </span>
              ) : null}
              {module.errorMessage ? (
                <span className="w-full text-xs text-red-400">
                  {module.errorMessage}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <h3 className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Discovered hostnames
      </h3>
      {hostnames.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">
          No hostnames in this scan yet (subdomain module may be skipped or
          empty).
        </p>
      ) : (
        <div className="mt-2">
          <p className="text-xs text-slate-500">
            {totalHostnames} total
            {totalHostnames > hostnames.length
              ? ` · showing ${hostnames.length}`
              : null}
          </p>
          <ul className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/50 p-2 font-mono text-xs text-slate-300">
            {hostnames.map((host) => (
              <li key={host} className="break-all py-0.5">
                {host}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
