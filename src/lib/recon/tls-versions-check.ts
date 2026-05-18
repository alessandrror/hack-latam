import tls from "node:tls";

import type { ScanFinding } from "@/types/scan";

const CONNECT_TIMEOUT_MS = 10_000;

/** Isolated version probes (min === max) to see if the server negotiates that protocol. */
const VERSION_PROBES: { label: string; min: tls.SecureVersion; max: tls.SecureVersion }[] =
  [
    { label: "TLSv1", min: "TLSv1", max: "TLSv1" },
    { label: "TLSv1.1", min: "TLSv1.1", max: "TLSv1.1" },
    { label: "TLSv1.2", min: "TLSv1.2", max: "TLSv1.2" },
    { label: "TLSv1.3", min: "TLSv1.3", max: "TLSv1.3" },
  ];

type ProbeRow = {
  version: string;
  negotiated: boolean;
  protocol?: string;
  cipher?: string;
};

function probeTlsVersion(
  hostname: string,
  label: string,
  minVersion: tls.SecureVersion,
  maxVersion: tls.SecureVersion,
): Promise<ProbeRow> {
  return new Promise((resolve) => {
    const socket = tls.connect({
      host: hostname,
      port: 443,
      servername: hostname,
      rejectUnauthorized: false,
      minVersion,
      maxVersion,
    });

    let finished = false;
    const finish = (row: ProbeRow) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      resolve(row);
    };

    const timer = setTimeout(() => {
      socket.destroy(new Error("probe timeout"));
      finish({ version: label, negotiated: false });
    }, CONNECT_TIMEOUT_MS);

    socket.once("secureConnect", () => {
      try {
        const protocol = socket.getProtocol() ?? undefined;
        const cipher = socket.getCipher();
        socket.end();
        finish({
          version: label,
          negotiated: true,
          ...(protocol ? { protocol } : {}),
          ...(cipher?.name ? { cipher: cipher.name } : {}),
        });
      } catch {
        socket.destroy();
        finish({ version: label, negotiated: false });
      }
    });

    socket.once("error", () => {
      finish({ version: label, negotiated: false });
    });
  });
}

/**
 * Deep-only: multiple TLS handshakes to detect support for legacy protocol versions.
 */
export async function collectTlsVersionFindings(
  hostname: string,
): Promise<ScanFinding[]> {
  const trimmed = hostname.trim().toLowerCase();
  if (!trimmed) return [];

  const probes: ProbeRow[] = [];

  for (const probe of VERSION_PROBES) {
    const row = await probeTlsVersion(trimmed, probe.label, probe.min, probe.max);
    probes.push(row);
  }

  const anyNegotiated = probes.some((r) => r.negotiated);
  if (!anyNegotiated) {
    return [
      {
        id: `tls-versions-${trimmed}`,
        module: "tls_versions",
        severity: "medium",
        title: "Las sondas de versiones TLS no se completaron",
        explanation:
          "Ninguno de los handshakes aislados TLS se completó con éxito; el host podría limitar verificaciones en paralelo, requerir otro edge TLS o estar temporalmente inaccesible. Compáralo con el módulo básico de certificado TLS.",
        metadata: { hostname: trimmed, probes },
      },
    ];
  }

  const supportedLabels = probes.filter((r) => r.negotiated).map((r) => r.version);
  const legacyEnabled = probes.some(
    (r) => r.negotiated && (r.version === "TLSv1" || r.version === "TLSv1.1"),
  );

  const severity = legacyEnabled ? "medium" : "low";
  const title = legacyEnabled
    ? "Protocolos TLS heredados (1.0 / 1.1) parecen estar habilitados"
    : "Las versiones TLS parecen modernas en sondas aisladas";

  const explanation = legacyEnabled
    ? "El servidor aceptó TLS 1.0 o 1.1 en al menos un handshake; cada vez más navegadores y reguladores los tratan como débiles. Deshabilita TLS heredado y prefiere TLS 1.2 o superior."
    : "Las sondas aisladas no negociaron TLS 1.0 ni 1.1. Es una buena señal, pero no garantiza la calidad de las suites de cifrado ni cubre todos los frontends de borde.";

  const finding: ScanFinding = {
    id: `tls-versions-${trimmed}`,
    module: "tls_versions",
    severity,
    title,
    explanation,
    metadata: {
      hostname: trimmed,
      supportedProtocols: supportedLabels,
      legacyTlsEnabled: legacyEnabled,
      probes,
    },
  };

  return [finding];
}
