import { promises as dns } from "node:dns";

import type { ScanModuleContext } from "@/lib/recon/scan-context";
import { extractApexFromNormalizedHost } from "@/lib/recon/extract-apex";
import type { ScanFinding } from "@/types/scan";

const FETCH_TIMEOUT_MS = 12_000;
const MODULE = "osint_passive";

function hostIdToken(host: string): string {
  return host.replace(/\./g, "-");
}

async function fetchWithTimeout(
  url: string,
  method: "GET" | "HEAD" = "GET",
): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "*/*",
        "User-Agent":
          "hack-latam-osint/0.1 (+https://github.com/) — passive defensive scan",
      },
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function resolveTxtSafe(name: string): Promise<string[]> {
  try {
    const rows = await dns.resolveTxt(name);
    return rows.map((chunks) => chunks.join(""));
  } catch {
    return [];
  }
}

async function hasDnskeyAtApex(apex: string): Promise<boolean | null> {
  try {
    const keys = await dns.resolve(apex, "DNSKEY");
    return Array.isArray(keys) && keys.length > 0;
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (
      err.code === "ENODATA" ||
      err.code === "ENOTFOUND" ||
      err.code === "ESERVFAIL"
    ) {
      return false;
    }
    return null;
  }
}

async function collectFindingsForHost(
  host: string,
  subjectSource: "primary" | "email_domain",
): Promise<ScanFinding[]> {
  const findings: ScanFinding[] = [];
  const id = hostIdToken(host);
  const apex = extractApexFromNormalizedHost(host);

  const secUrl = `https://${host}/.well-known/security.txt`;
  const secRes = await fetchWithTimeout(secUrl, "GET");

  if (!secRes || !secRes.ok) {
    findings.push({
      id: `osint-passive-${id}-securitytxt-missing`,
      module: MODULE,
      severity: "low",
      title: `security.txt not reachable for ${host}`,
      explanation:
        "A public security.txt helps security researchers report issues responsibly. If you expect external reports, publish one at /.well-known/security.txt over HTTPS.",
      metadata: {
        subjectHost: host,
        subjectSource,
        source: "osint_passive",
        check: "security_txt",
        present: false,
        url: secUrl,
        httpStatus: secRes?.status ?? null,
      },
    });
  } else {
    const text = (await secRes.text()).slice(0, 8000);
    const lines = text.split(/\r?\n/).map((l) => l.trim());
    const contactLines = lines.filter(
      (l) => /^contact:/i.test(l) || /^preferred-languages:/i.test(l),
    );
    findings.push({
      id: `osint-passive-${id}-securitytxt-present`,
      module: MODULE,
      severity: "low",
      title: `security.txt is published for ${host}`,
      explanation:
        "Good — you signal how to report security issues. Keep contact fields current.",
      metadata: {
        subjectHost: host,
        subjectSource,
        source: "osint_passive",
        check: "security_txt",
        present: true,
        url: secUrl,
        sampleLines: contactLines.slice(0, 5),
      },
    });
  }

  const rootRes = await fetchWithTimeout(`https://${host}/`, "HEAD");
  const rootGet = rootRes?.ok ? rootRes : await fetchWithTimeout(`https://${host}/`, "GET");

  if (!rootGet || !rootGet.ok) {
    findings.push({
      id: `osint-passive-${id}-https-head-fail`,
      module: MODULE,
      severity: "low",
      title: `HTTPS root check inconclusive for ${host}`,
      explanation:
        "We could not reliably read response headers from https:// on this hostname — the site may redirect, block bots, or lack TLS on this name.",
      metadata: {
        subjectHost: host,
        subjectSource,
        source: "osint_passive",
        check: "https_headers",
        httpStatus: rootGet?.status ?? null,
      },
    });
    return findings;
  }

  const h = rootGet.headers;
  const hsts = h.get("strict-transport-security");
  const csp = h.get("content-security-policy");
  const xfo = h.get("x-frame-options");
  const ref = h.get("referrer-policy");
  const perms = h.get("permissions-policy") ?? h.get("feature-policy");

  if (!hsts) {
    findings.push({
      id: `osint-passive-${id}-no-hsts`,
      module: MODULE,
      severity: "medium",
      title: `Strict-Transport-Security (HSTS) not observed for ${host}`,
      explanation:
        "Without HSTS, users can be downgraded to plaintext more easily. Enable HSTS at the edge or origin when you control HTTPS.",
      metadata: {
        subjectHost: host,
        subjectSource,
        source: "osint_passive",
        check: "hsts",
        present: false,
      },
    });
  } else {
    findings.push({
      id: `osint-passive-${id}-hsts`,
      module: MODULE,
      severity: "low",
      title: `HSTS header present for ${host}`,
      explanation:
        "Browsers remember to use HTTPS for this host, which reduces trivial downgrade risk.",
      metadata: {
        subjectHost: host,
        subjectSource,
        source: "osint_passive",
        check: "hsts",
        present: true,
        valuePreview: hsts.slice(0, 200),
      },
    });
  }

  if (!csp) {
    findings.push({
      id: `osint-passive-${id}-no-csp`,
      module: MODULE,
      severity: "low",
      title: `Content-Security-Policy not set for ${host}`,
      explanation:
        "CSP narrows what scripts and assets can load — useful against XSS and some supply-chain risks. Consider a staged rollout.",
      metadata: {
        subjectHost: host,
        subjectSource,
        source: "osint_passive",
        check: "csp",
      },
    });
  }

  if (!xfo && !csp?.toLowerCase().includes("frame-ancestors")) {
    findings.push({
      id: `osint-passive-${id}-framing`,
      module: MODULE,
      severity: "low",
      title: `Framing controls not obvious for ${host}`,
      explanation:
        "X-Frame-Options or CSP frame-ancestors reduces clickjacking. Add one if you expose interactive pages.",
      metadata: {
        subjectHost: host,
        subjectSource,
        source: "osint_passive",
        check: "frame_controls",
      },
    });
  }

  if (!ref) {
    findings.push({
      id: `osint-passive-${id}-referrer-policy`,
      module: MODULE,
      severity: "low",
      title: `Referrer-Policy not set for ${host}`,
      explanation:
        "Referrer-Policy limits data leaked in outbound navigation metadata — modest privacy/security win.",
      metadata: {
        subjectHost: host,
        subjectSource,
        source: "osint_passive",
        check: "referrer_policy",
      },
    });
  }

  if (perms) {
    findings.push({
      id: `osint-passive-${id}-permissions-policy`,
      module: MODULE,
      severity: "low",
      title: `Permissions-Policy present for ${host}`,
      explanation: "Fine-grained browser feature toggles are configured.",
      metadata: {
        subjectHost: host,
        subjectSource,
        source: "osint_passive",
        check: "permissions_policy",
        valuePreview: perms.slice(0, 200),
      },
    });
  }

  const mtaStsName = `_mta-sts.${host}`;
  const mtaStsTxt = await resolveTxtSafe(mtaStsName);
  const hasMtaSts = mtaStsTxt.some((line) =>
    /^\s*v=stsv1\s*;/i.test(line.trim()),
  );
  findings.push({
    id: `osint-passive-${id}-mta-sts`,
    module: MODULE,
    severity: hasMtaSts ? "low" : "medium",
    title: hasMtaSts
      ? `MTA-STS DNS record found (${mtaStsName})`
      : `No MTA-STS TXT at ${mtaStsName}`,
    explanation: hasMtaSts
      ? "MTA-STS helps receiving mail servers require encrypted SMTP for addresses on this hostname, reducing downgrade attacks."
      : "Without MTA-STS, SMTP transport for mail on this hostname may be easier to degrade in transit — consider STS for primary mail domains.",
    metadata: {
      subjectHost: host,
      subjectSource,
      source: "osint_passive",
      check: "mta_sts",
      host: mtaStsName,
      present: hasMtaSts,
    },
  });

  const tlsRptName = `_smtp._tls.${host}`;
  const tlsRptTxt = await resolveTxtSafe(tlsRptName);
  const hasTlsRpt = tlsRptTxt.some((line) =>
    /^\s*v=tlsrptv1\b/i.test(line.trim()),
  );
  findings.push({
    id: `osint-passive-${id}-tls-rpt`,
    module: MODULE,
    severity: hasTlsRpt ? "low" : "low",
    title: hasTlsRpt
      ? `TLS reporting (TLS-RPT) TXT found (${tlsRptName})`
      : `No TLS-RPT TXT at ${tlsRptName}`,
    explanation: hasTlsRpt
      ? "TLS-RPT can alert you to inbound SMTP TLS failures — useful operational visibility."
      : "TLS-RPT is optional but helps detect mail transport TLS issues when published at _smtp._tls.",
    metadata: {
      subjectHost: host,
      subjectSource,
      source: "osint_passive",
      check: "tls_rpt",
      host: tlsRptName,
      present: hasTlsRpt,
    },
  });

  const bimiName = `default._bimi.${host}`;
  const bimiTxt = await resolveTxtSafe(bimiName);
  const hasBimi = bimiTxt.some((line) =>
    /^\s*v=bimi1\b/i.test(line.trim()),
  );
  findings.push({
    id: `osint-passive-${id}-bimi`,
    module: MODULE,
    severity: "low",
    title: hasBimi
      ? `BIMI record present (${bimiName})`
      : `No default BIMI record at ${bimiName}`,
    explanation: hasBimi
      ? "BIMI ties brand logos to validated email — often paired with strong DMARC."
      : "BIMI is optional brand signaling; absence alone is not a vulnerability.",
    metadata: {
      subjectHost: host,
      subjectSource,
      source: "osint_passive",
      check: "bimi",
      host: bimiName,
      present: hasBimi,
    },
  });

  if (apex) {
    const dnssec = await hasDnskeyAtApex(apex);
    if (dnssec === true) {
      findings.push({
        id: `osint-passive-${id}-dnssec`,
        module: MODULE,
        severity: "low",
        title: `DNSSEC DNSKEY present at apex ${apex}`,
        explanation:
          "Your DNS zone appears to publish DNSKEYs — resolvers that validate DNSSEC get stronger integrity guarantees for signed records.",
        metadata: {
          subjectHost: host,
          subjectSource,
          source: "osint_passive",
          check: "dnssec",
          apex,
          likelySigned: true,
        },
      });
    } else if (dnssec === false) {
      findings.push({
        id: `osint-passive-${id}-dnssec-absent`,
        module: MODULE,
        severity: "low",
        title: `No DNSKEY at apex ${apex} (DNSSEC not indicated)`,
        explanation:
          "Many zones still run without DNSSEC. If you operate high-risk infrastructure, consider signing with your DNS provider.",
        metadata: {
          subjectHost: host,
          subjectSource,
          source: "osint_passive",
          check: "dnssec",
          apex,
          likelySigned: false,
        },
      });
    } else {
      findings.push({
        id: `osint-passive-${id}-dnssec-unknown`,
        module: MODULE,
        severity: "low",
        title: `DNSSEC status unclear for apex ${apex}`,
        explanation:
          "We could not confirm DNSKEY presence — resolver errors or split views can hide this signal.",
        metadata: {
          subjectHost: host,
          subjectSource,
          source: "osint_passive",
          check: "dnssec",
          apex,
          likelySigned: null,
        },
      });
    }
  }

  return findings;
}

/**
 * Passive keyless OSINT: security.txt, HTTPS security headers, MTA-STS/TLS-RPT/BIMI TXT, DNSSEC hint.
 */
export async function collectPassiveOsintFindings(
  ctx: ScanModuleContext,
): Promise<ScanFinding[]> {
  const hosts = ctx.osintHostnames ?? [];
  const out: ScanFinding[] = [];

  const meta = ctx.emailOsintMeta;
  if (meta) {
    if (meta.skippedExternalDomains.length > 0) {
      out.push({
        id: `osint-passive-email-skipped-external`,
        module: MODULE,
        severity: "low",
        title: "Some pasted email domains are outside the scan apex",
        explanation:
          "Only mail domains under the same registrable apex as your primary scan target are assessed. Others were skipped to avoid third-party recon.",
        metadata: {
          source: "osint_passive",
          check: "email_apex_filter",
          skippedExternalDomains: meta.skippedExternalDomains.slice(0, 30),
          skippedCount: meta.skippedExternalDomains.length,
        },
      });
    }
    if (meta.truncatedEmailList) {
      out.push({
        id: `osint-passive-email-truncated-lines`,
        module: MODULE,
        severity: "low",
        title: "Email list was truncated",
        explanation:
          "Too many entries were pasted — only the first batch was parsed. Split into multiple scans if needed.",
        metadata: { source: "osint_passive", check: "email_cap_lines" },
      });
    }
    if (meta.truncatedUniqueDomainList) {
      out.push({
        id: `osint-passive-email-truncated-domains`,
        module: MODULE,
        severity: "low",
        title: "Distinct email domains capped",
        explanation:
          "Only a limited number of unique domains from the list are included in OSINT. Remove noise or run separate scans.",
        metadata: { source: "osint_passive", check: "email_cap_domains" },
      });
    }
  }

  const primaryHost =
    ctx.inputKind === "domain"
      ? ctx.normalizedTarget.trim().toLowerCase().replace(/^www\./, "")
      : null;

  for (const host of hosts) {
    const subjectSource =
      primaryHost && host === primaryHost ? "primary" : "email_domain";
    const slice = await collectFindingsForHost(host, subjectSource);
    out.push(...slice);
  }

  return out;
}
