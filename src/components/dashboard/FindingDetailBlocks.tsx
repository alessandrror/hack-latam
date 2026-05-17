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

  if (finding.module === "dns_auth_details") {
    const m = raw as Record<string, unknown>;
    const check = typeof m.check === "string" ? m.check : null;
    if (!check) return null;
    const summary = typeof m.summary === "string" ? m.summary : null;
    const host = typeof m.host === "string" ? m.host : null;
    const spfTail = typeof m.spfTail === "string" ? m.spfTail : null;
    const dmarcP = typeof m.dmarcP === "string" ? m.dmarcP : null;
    const dmarcPct =
      typeof m.dmarcPct === "number" && Number.isFinite(m.dmarcPct)
        ? m.dmarcPct
        : null;
    return (
      <div className="mt-3 rounded-lg border border-slate-700/80 bg-slate-950/50 p-3 text-xs">
        <p className="font-semibold uppercase tracking-wide text-slate-500">
          Email policy — {check}
        </p>
        <dl className="mt-2 grid gap-1 font-mono text-slate-200 [@media(min-width:480px)]:grid-cols-[auto_1fr] [@media(min-width:480px)]:gap-x-3">
          {host ? (
            <>
              <dt className="text-slate-500">Lookup</dt>
              <dd className="break-all">{host}</dd>
            </>
          ) : null}
          {spfTail ? (
            <>
              <dt className="text-slate-500">SPF terminal</dt>
              <dd>{spfTail}</dd>
            </>
          ) : null}
          {dmarcP ? (
            <>
              <dt className="text-slate-500">DMARC p=</dt>
              <dd>{dmarcP}</dd>
            </>
          ) : null}
          {dmarcPct !== null ? (
            <>
              <dt className="text-slate-500">pct</dt>
              <dd>{dmarcPct}%</dd>
            </>
          ) : null}
          {summary ? (
            <>
              <dt className="text-slate-500">Record</dt>
              <dd className="break-all">{summary}</dd>
            </>
          ) : null}
        </dl>
      </div>
    );
  }

  if (finding.module === "dns_caa") {
    const m = raw as Record<string, unknown>;
    const hostname = typeof m.hostname === "string" ? m.hostname : null;
    const present = typeof m.caaPresent === "boolean" ? m.caaPresent : null;
    const issue =
      Array.isArray(m.issue) && m.issue.every((x) => typeof x === "string")
        ? (m.issue as string[])
        : null;
    const issuewild =
      Array.isArray(m.issuewild) &&
      m.issuewild.every((x) => typeof x === "string")
        ? (m.issuewild as string[])
        : null;
    const count =
      typeof m.recordCount === "number" && Number.isFinite(m.recordCount)
        ? m.recordCount
        : null;
    return (
      <div className="mt-3 rounded-lg border border-slate-700/80 bg-slate-950/50 p-3 text-xs">
        <p className="font-semibold uppercase tracking-wide text-slate-500">
          CAA records
        </p>
        <dl className="mt-2 grid gap-1 font-mono text-slate-200 [@media(min-width:480px)]:grid-cols-[auto_1fr] [@media(min-width:480px)]:gap-x-3">
          {hostname ? (
            <>
              <dt className="text-slate-500">Zone</dt>
              <dd className="break-all">{hostname}</dd>
            </>
          ) : null}
          {present !== null ? (
            <>
              <dt className="text-slate-500">Records</dt>
              <dd>{present ? "Present" : "None"}</dd>
            </>
          ) : null}
          {count !== null ? (
            <>
              <dt className="text-slate-500">RR count</dt>
              <dd>{count}</dd>
            </>
          ) : null}
          {issue && issue.length > 0 ? (
            <>
              <dt className="text-slate-500">issue</dt>
              <dd className="break-all">{issue.join(", ")}</dd>
            </>
          ) : null}
          {issuewild && issuewild.length > 0 ? (
            <>
              <dt className="text-slate-500">issuewild</dt>
              <dd className="break-all">{issuewild.join(", ")}</dd>
            </>
          ) : null}
        </dl>
      </div>
    );
  }

  if (finding.module === "tls_versions") {
    const m = raw as Record<string, unknown>;
    const hostname = typeof m.hostname === "string" ? m.hostname : null;
    const supported =
      Array.isArray(m.supportedProtocols) &&
      m.supportedProtocols.every((x) => typeof x === "string")
        ? (m.supportedProtocols as string[])
        : null;
    const legacy =
      typeof m.legacyTlsEnabled === "boolean" ? m.legacyTlsEnabled : null;
    const probes = Array.isArray(m.probes) ? m.probes : null;
    return (
      <div className="mt-3 rounded-lg border border-slate-700/80 bg-slate-950/50 p-3 text-xs">
        <p className="font-semibold uppercase tracking-wide text-slate-500">
          TLS version probes
        </p>
        <dl className="mt-2 grid gap-1 font-mono text-slate-200 [@media(min-width:480px)]:grid-cols-[auto_1fr] [@media(min-width:480px)]:gap-x-3">
          {hostname ? (
            <>
              <dt className="text-slate-500">Host</dt>
              <dd className="break-all">{hostname}</dd>
            </>
          ) : null}
          {legacy !== null ? (
            <>
              <dt className="text-slate-500">Legacy TLS</dt>
              <dd>{legacy ? "TLS 1.0/1.1 observed" : "Not observed"}</dd>
            </>
          ) : null}
          {supported && supported.length > 0 ? (
            <>
              <dt className="text-slate-500">Negotiated bands</dt>
              <dd className="break-all">{supported.join(", ")}</dd>
            </>
          ) : null}
        </dl>
        {probes && probes.length > 0 ? (
          <ul className="mt-3 space-y-1 border-t border-slate-800 pt-2 text-slate-300">
            {probes.map((p, i) => {
              if (!p || typeof p !== "object") return null;
              const row = p as Record<string, unknown>;
              const v = typeof row.version === "string" ? row.version : "?";
              const ok = row.negotiated === true;
              const prot = typeof row.protocol === "string" ? row.protocol : null;
              const cipher = typeof row.cipher === "string" ? row.cipher : null;
              return (
                <li key={`${v}-${i}`} className="flex flex-wrap gap-x-2 gap-y-0.5">
                  <span className="text-slate-500">{v}</span>
                  <span>{ok ? "ok" : "—"}</span>
                  {prot ? (
                    <span className="text-slate-400">{prot}</span>
                  ) : null}
                  {cipher ? (
                    <span className="text-slate-500 break-all">{cipher}</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
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
