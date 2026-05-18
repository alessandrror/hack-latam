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
      title: "No se pudo leer un certificado TLS",
      explanation:
        "El servidor no presentó un certificado hoja utilizable durante el handshake; verifica que HTTPS esté configurado correctamente.",
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
      title: "La información de fechas del certificado no está clara",
      explanation:
        "Se conectó por TLS, pero no fue posible leer con fiabilidad las fechas de validez; revisa el certificado en el panel de tu hosting.",
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
    expiryTitle = "No se pudo interpretar la expiración del certificado";
    expiryExplanation =
      "Verifica manualmente que tu certificado HTTPS es válido y se renueva a tiempo.";
  } else if (daysLeft < 0) {
    expirySeverity = "critical";
    expiryTitle = "El certificado TLS parece estar expirado";
    expiryExplanation =
      "Los navegadores y clientes podrían bloquear o alertar a los usuarios; renueva el certificado cuanto antes.";
  } else if (daysLeft <= 14) {
    expirySeverity = "medium";
    expiryTitle = `El certificado TLS expira en ${daysLeft} día(s)`;
    expiryExplanation =
      "Planifica la renovación pronto para que los visitantes no vean avisos de seguridad.";
  } else if (daysLeft <= 30) {
    expirySeverity = "medium";
    expiryTitle = `El certificado TLS expira en ${daysLeft} día(s)`;
    expiryExplanation =
      "Renueva antes de la expiración para evitar caídas o avisos del navegador.";
  } else {
    expirySeverity = "low";
    expiryTitle = `Certificado TLS válido — expira en ${daysLeft} día(s)`;
    expiryExplanation =
      "El sitio presentó un certificado con un rango de validez normal; mantén activada la renovación automática.";
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
      title: "El certificado podría no coincidir con este nombre de host",
      explanation:
        "Los nombres del certificado no incluyen de forma obvia este hostname; los usuarios podrían ver avisos si no se sirve otro certificado mediante SNI.",
      metadata: { hostname },
    });
  }

  if (authError) {
    findings.push({
      id: `tls-check-chain-${hostname}`,
      module: "tls_check",
      severity: "medium",
      title: "La validación de la cadena TLS reportó un problema",
      explanation: `Se completó el handshake, pero la verificación del certificado reportó: ${authError.message}. Los visitantes con comprobaciones estrictas podrían seguir viendo avisos; confirma que la cadena completa está instalada.`,
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
