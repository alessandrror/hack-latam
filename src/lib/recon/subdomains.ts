import type { ScanFinding } from "@/types/scan";

type CrtShEntry = {
  name_value?: string;
  common_name?: string;
};

const CRT_SH_BASE = "https://crt.sh/";
const FETCH_TIMEOUT_MS = 25_000;

function severityForSubdomainCount(count: number): "medium" | "low" {
  if (count > 50) {
    return "medium";
  }
  return "low";
}

function explanationForCount(count: number): string {
  if (count === 0) {
    return "No aparecieron nombres de host adicionales en los registros públicos de certificados para este dominio; menos nombres expuestos pueden indicar una huella menor (no es una garantía de que todos los activos hayan desaparecido).";
  }
  if (count > 50) {
    return "Hay muchos nombres de host asociados a esta marca en los registros de transparencia de certificados; cada nombre puede ser otro lugar donde los atacantes prueban configuraciones débiles.";
  }
  return "Los registros de transparencia de certificados listan varios nombres de host para este dominio; normalmente, a más nombres, más lugares para mantener parcheados y monitoreados.";
}

/**
 * Fetch subdomains/hostnames seen in crt.sh for a registrable-style domain (e.g. example.com).
 */
export async function enumerateSubdomainsFromCrtSh(
  domain: string,
): Promise<ScanFinding[]> {
  const trimmed = domain.trim().toLowerCase();
  if (!trimmed) {
    return [];
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const url = `${CRT_SH_BASE}?q=${encodeURIComponent(
    `%.${trimmed}`,
  )}&output=json`;

  let response: Response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "hack-latam-recon/0.1 (+https://github.com/)",
      },
      next: { revalidate: 0 },
    });
  } catch (cause) {
    clearTimeout(timeout);
    const message = cause instanceof Error ? cause.message : "Unknown error";
    throw new Error(`crt.sh request failed: ${message}`);
  }
  clearTimeout(timeout);

  if (!response.ok) {
    throw new Error(`crt.sh returned HTTP ${response.status}`);
  }

  const rawText = await response.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error("crt.sh returned non-JSON payload");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("crt.sh JSON was not an array");
  }

  const hosts = new Set<string>();
  for (const row of parsed as CrtShEntry[]) {
    const candidates = [row.name_value, row.common_name];
    for (const value of candidates) {
      if (typeof value !== "string" || !value.trim()) {
        continue;
      }
      for (const part of value.split(/\n/)) {
        const host = part
          .trim()
          .toLowerCase()
          .replace(/^\*\./, "");
        if (!host || !host.endsWith(trimmed)) {
          continue;
        }
        // Skip obvious junk tokens
        if (host.includes(" ") || host.includes("*")) {
          continue;
        }
        hosts.add(host);
      }
    }
  }

  const sorted = [...hosts].sort((a, b) => a.localeCompare(b));
  const severity = severityForSubdomainCount(sorted.length);
  const explanation = explanationForCount(sorted.length);

  const finding: ScanFinding = {
    id: `subdomain-enum-crt-${trimmed}`,
    module: "subdomain_enum",
    severity,
    title:
      sorted.length === 0
        ? "No se encontraron subdominios en la transparencia de certificados (crt.sh)"
        : `${sorted.length} nombre(s) de host encontrados vía transparencia de certificados`,
    explanation,
    metadata: {
      source: "crt.sh",
      hostnames: sorted.slice(0, 200),
      totalHostnames: sorted.length,
      truncatedListMax: 200,
    },
  };

  return [finding];
}
