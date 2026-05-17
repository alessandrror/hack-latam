import type { ScanFinding } from "@/types/scan";

export function FindingDetailBlocks({ finding }: { finding: ScanFinding }) {
  const raw = finding.metadata;
  if (!raw || typeof raw !== "object") return null;

  if (finding.module === "dns_health") {
    const m = raw as Record<string, unknown>;
    const check = typeof m.check === "string" ? m.check : null;
    if (!check) return null;

    const present = typeof m.present === "boolean" ? m.present : null;
    const host = typeof m.host === "string" ? m.host : null;
    const summary = typeof m.summary === "string" ? m.summary : null;
    const matched =
      Array.isArray(m.selectorsMatched) &&
      m.selectorsMatched.every((x) => typeof x === "string")
        ? (m.selectorsMatched as string[])
        : null;

    return (
      <div className="mt-3 rounded-lg border border-slate-700/80 bg-slate-950/50 p-3 text-xs">
        <p className="font-semibold uppercase tracking-wide text-slate-500">
          DNS detail — {check}
        </p>
        <dl className="mt-2 grid gap-1 font-mono text-slate-200 [@media(min-width:480px)]:grid-cols-[auto_1fr] [@media(min-width:480px)]:gap-x-3">
          {present !== null ? (
            <>
              <dt className="text-slate-500">Record</dt>
              <dd>{present ? "Present" : "Not found"}</dd>
            </>
          ) : null}
          {host ? (
            <>
              <dt className="text-slate-500">Lookup</dt>
              <dd className="break-all">{host}</dd>
            </>
          ) : null}
          {summary ? (
            <>
              <dt className="text-slate-500">Notes</dt>
              <dd>{summary}</dd>
            </>
          ) : null}
          {matched && matched.length > 0 ? (
            <>
              <dt className="text-slate-500">Selectors</dt>
              <dd className="break-all">{matched.join(", ")}</dd>
            </>
          ) : null}
        </dl>
      </div>
    );
  }

  if (finding.module === "tls_check") {
    const m = raw as Record<string, unknown>;
    const validFrom = typeof m.validFrom === "string" ? m.validFrom : null;
    const validTo = typeof m.validTo === "string" ? m.validTo : null;
    const issuer = typeof m.issuer === "string" ? m.issuer : null;
    const hostname = typeof m.hostname === "string" ? m.hostname : null;
    const daysRemaining =
      typeof m.daysRemaining === "number" ? m.daysRemaining : null;

    if (!validFrom && !validTo && !issuer && !hostname && daysRemaining == null) {
      return null;
    }

    return (
      <div className="mt-3 rounded-lg border border-slate-700/80 bg-slate-950/50 p-3 text-xs">
        <p className="font-semibold uppercase tracking-wide text-slate-500">
          Certificate snapshot
        </p>
        <dl className="mt-2 grid gap-1 font-mono text-slate-200 [@media(min-width:480px)]:grid-cols-[auto_1fr] [@media(min-width:480px)]:gap-x-3">
          {hostname ? (
            <>
              <dt className="text-slate-500">Host</dt>
              <dd className="break-all">{hostname}</dd>
            </>
          ) : null}
          {validFrom ? (
            <>
              <dt className="text-slate-500">Valid from</dt>
              <dd>{validFrom}</dd>
            </>
          ) : null}
          {validTo ? (
            <>
              <dt className="text-slate-500">Valid until</dt>
              <dd>{validTo}</dd>
            </>
          ) : null}
          {daysRemaining !== null ? (
            <>
              <dt className="text-slate-500">Days left</dt>
              <dd>{daysRemaining}</dd>
            </>
          ) : null}
          {issuer ? (
            <>
              <dt className="text-slate-500">Issuer</dt>
              <dd className="break-all">{issuer}</dd>
            </>
          ) : null}
        </dl>
      </div>
    );
  }

  return null;
}
