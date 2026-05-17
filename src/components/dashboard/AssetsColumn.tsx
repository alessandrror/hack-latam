import { MODULE_DISPLAY_ORDER } from "@/lib/dashboard/findings";
import type { ScanModuleResult } from "@/types/scan";

import { Card, CardContent } from "@/components/ui/card";

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

function moduleStatusLabel(status: ScanModuleResult["status"]): string {
  switch (status) {
    case "ok":
      return "correcto";
    case "error":
      return "fallo";
    case "skipped":
      return "omitido";
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
    <Card className="gap-0 border border-border py-0 shadow-sm">
      <CardContent className="flex flex-col gap-4 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Activos y estado
      </h2>
      <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3">
        <p className="text-xs text-muted-foreground">Dominio objetivo</p>
        <p className="mt-1 font-mono text-sm font-medium break-all text-foreground">
          {displayTarget || "—"}
        </p>
        {normalizedTarget ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Normalizado:{" "}
            <span className="font-mono text-foreground">{normalizedTarget}</span>
            {inputKind ? (
              <span className="text-muted-foreground/80"> · {inputKind}</span>
            ) : null}
          </p>
        ) : null}
      </div>

      <h3 className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Módulos
      </h3>
      {list.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Aún no hay resultados de módulos: el análisis pudo fallar o estar en curso.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {list.map((module) => (
            <li
              key={module.name}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/25 px-3 py-2.5 text-sm"
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${moduleStatusDot(module.status)}`}
                title={module.status}
                aria-hidden
              />
              <span className="font-mono text-foreground">{module.name}</span>
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium uppercase text-muted-foreground">
                {moduleStatusLabel(module.status)}
              </span>
              {typeof module.durationMs === "number" ? (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {module.durationMs} ms
                </span>
              ) : null}
              {module.errorMessage ? (
                <span className="w-full text-xs text-destructive">
                  {module.errorMessage}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <h3 className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Hostnames descubiertos
      </h3>
      {hostnames.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          No aparecen hostnames en este resultado (por ejemplo porque el modo omitió CT
          o no hay entradas en logs públicos para este dominio).
        </p>
      ) : (
        <div className="mt-2">
          <p className="text-xs text-muted-foreground">
            {totalHostnames} en total
            {totalHostnames > hostnames.length
              ? ` · mostrando ${hostnames.length}`
              : null}
          </p>
          <ul className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-border bg-muted/40 p-2 font-mono text-xs text-foreground">
            {hostnames.map((host) => (
              <li key={host} className="break-all py-0.5">
                {host}
              </li>
            ))}
          </ul>
        </div>
      )}
      </CardContent>
    </Card>
  );
}
