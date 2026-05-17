import tls from "node:tls";

import type { ScanFinding } from "@/types/scan";

const CONNECT_TIMEOUT_MS = 15_000;

function parseDaysUntil(dateMs: number): number {
  return Math.ceil((dateMs - Date.now()) / (24 * 60 * 60 * 1000));
}

function commonNames(cert: tls.PeerCertificate): string[] {
  const cn = cert.subject?.CN;
  if (cn === undefined) return [];
  return Array.isArray(cn)
    ? cn.map((entry) => String(entry).toLowerCase())
    : [String(cn).toLowerCase()];
}

function hostMatchesCert(hostname: string, cert: tls.PeerCertificate): boolean {
  const lowerHost = hostname.toLowerCase();

  for (const cn of commonNames(cert)) {
    if (cn && matchName(lowerHost, cn)) return true;
  }

  const sanRaw = cert.subjectaltname;
  if (typeof sanRaw !== "string") return false;

  const entries = sanRaw.split(",").map((s) => s.trim());
  for (const entry of entries) {
    const dnsPrefix = "DNS:";
    if (!entry.toUpperCase().startsWith(dnsPrefix)) continue;
    const name = entry.slice(dnsPrefix.length).trim().toLowerCase();
    if (name && matchName(lowerHost, name)) return true;
  }

  return false;
}

function matchName(hostname: string, pattern: string): boolean {
  if (pattern.startsWith("*.")) {
    const remainder = pattern.slice(2); // "example.com" after "*."
    if (hostname === remainder) return true;
    return hostname.endsWith("." + remainder);
  }
  return hostname === pattern;
}

function collectTlsFindingsSync(
  hostname: string,
  cert: tls.PeerCertificate | object | null,
  authError?: Error | null,
): ScanFinding[] {
  const findings: ScanFinding[] = [];

  if (!cert || typeof cert !== "object" || Object.keys(cert).length === 0) {
    findings.push({
      id: `tls-check-no-cert-${hostname}`,
      module: "tls_check",
      severity: "medium",
      title: "Could not read a TLS certificate",
      explanation:
        "The server did not present a usable leaf certificate during the handshake — check that HTTPS is configured correctly.",
      metadata: { hostname },
    });
    return findings;
  }

  const leaf = cert as tls.PeerCertificate;
  const validToStr = leaf.valid_to;
  const validFromStr = leaf.valid_from;

  if (!validToStr || !validFromStr) {
    findings.push({
      id: `tls-check-dates-${hostname}`,
      module: "tls_check",
      severity: "low",
      title: "Certificate date information unclear",
      explanation:
        "We connected over TLS but could not reliably read validity dates — review the certificate in your hosting panel.",
      metadata: { hostname },
    });
    return findings;
  }

  const validTo = new Date(validToStr).getTime();
  const daysLeft = parseDaysUntil(validTo);

  let expirySeverity: "critical" | "medium" | "low";
  let expiryTitle: string;
  let expiryExplanation: string;

  if (Number.isNaN(validTo)) {
    expirySeverity = "low";
    expiryTitle = "Certificate expiry could not be parsed";
    expiryExplanation =
      "Verify manually that your HTTPS certificate is valid and renewed on schedule.";
  } else if (daysLeft < 0) {
    expirySeverity = "critical";
    expiryTitle = "TLS certificate appears expired";
    expiryExplanation =
      "Browsers and clients may block or warn users — renew the certificate as soon as possible.";
  } else if (daysLeft <= 14) {
    expirySeverity = "medium";
    expiryTitle = `TLS certificate expires in ${daysLeft} day(s)`;
    expiryExplanation =
      "Plan renewal soon so visitors do not see security warnings.";
  } else if (daysLeft <= 30) {
    expirySeverity = "medium";
    expiryTitle = `TLS certificate expires in ${daysLeft} day(s)`;
    expiryExplanation =
      "Renew before expiry to avoid downtime or browser warnings.";
  } else {
    expirySeverity = "low";
    expiryTitle = `TLS certificate valid — expires in ${daysLeft} day(s)`;
    expiryExplanation =
      "The site presented a certificate with a normal validity window — keep auto-renewal enabled.";
  }

  const issuerO = leaf.issuer?.O;
  const issuerCn = leaf.issuer?.CN;
  const issuerSummary = Array.isArray(issuerO)
    ? issuerO.join(", ")
    : typeof issuerO === "string"
      ? issuerO
      : Array.isArray(issuerCn)
        ? issuerCn.join(", ")
        : typeof issuerCn === "string"
          ? issuerCn
          : undefined;

  findings.push({
    id: `tls-check-expiry-${hostname}`,
    module: "tls_check",
    severity: expirySeverity,
    title: expiryTitle,
    explanation: expiryExplanation,
    metadata: {
      hostname,
      validFrom: validFromStr,
      validTo: validToStr,
      daysRemaining: Number.isFinite(daysLeft) ? daysLeft : undefined,
      issuer: issuerSummary,
    },
  });

  const covers = hostMatchesCert(hostname, leaf);
  if (!covers) {
    findings.push({
      id: `tls-check-names-${hostname}`,
      module: "tls_check",
      severity: "medium",
      title: "Certificate may not match this hostname",
      explanation:
        "The certificate's names do not obviously include this hostname — users may see warnings unless another certificate is served via SNI.",
      metadata: { hostname },
    });
  }

  if (authError) {
    findings.push({
      id: `tls-check-chain-${hostname}`,
      module: "tls_check",
      severity: "medium",
      title: "TLS chain validation reported an issue",
      explanation: `Handshake completed but certificate verification reported: ${authError.message}. Visitors using strict checks may still see warnings — confirm the full chain is installed.`,
      metadata: { hostname },
    });
  }

  return findings;
}

/**
 * Passive TLS inspection on port 443 (handshake only, no exploitation).
 */
export async function collectTlsFindings(
  hostname: string,
): Promise<ScanFinding[]> {
  const trimmed = hostname.trim().toLowerCase();

  return new Promise((resolve, reject) => {
    let settled = false;
    const socket = tls.connect({
      host: trimmed,
      port: 443,
      servername: trimmed,
      rejectUnauthorized: false,
    });

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    const timer = setTimeout(() => {
      socket.destroy(new Error("TLS connection timed out"));
    }, CONNECT_TIMEOUT_MS);

    socket.once("secureConnect", () => {
      clearTimeout(timer);

      const cert = socket.getPeerCertificate(false);
      const authIssue =
        !socket.authorized && socket.authorizationError
          ? socket.authorizationError
          : null;

      const findings = collectTlsFindingsSync(trimmed, cert, authIssue);

      socket.end();
      finish(() => resolve(findings));
    });

    socket.once("error", (err) => {
      clearTimeout(timer);
      finish(() =>
        reject(
          err instanceof Error
            ? err
            : new Error(`TLS connection failed: ${String(err)}`),
        ),
      );
    });
  });
}
