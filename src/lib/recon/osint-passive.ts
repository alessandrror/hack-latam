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
      title: `No se pudo acceder a security.txt para ${host}`,
      explanation:
        "Un security.txt público ayuda a que los investigadores de seguridad informen de forma responsable. Si esperas reportes externos, publica uno en /.well-known/security.txt mediante HTTPS.",
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
      title: `security.txt está publicado para ${host}`,
      explanation:
        "Bien: indicas cómo reportar incidencias de seguridad. Mantén actualizados los campos de contacto.",
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
      title: `La comprobación del root HTTPS para ${host} es inconclusa`,
      explanation:
        "No fue posible leer con fiabilidad las cabeceras de respuesta de https:// en este nombre de host; el sitio puede redirigir, bloquear bots o no tener TLS para este nombre.",
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
      title: `No se observó Strict-Transport-Security (HSTS) para ${host}`,
      explanation:
        "Sin HSTS, es más fácil degradar a texto plano. Habilita HSTS en el edge o en el origen cuando controles HTTPS.",
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
      title: `Se detectó el encabezado HSTS para ${host}`,
      explanation:
        "Los navegadores recuerdan usar HTTPS para este host, lo que reduce el riesgo trivial de degradación.",
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
      title: `No se configuró Content-Security-Policy para ${host}`,
      explanation:
        "CSP limita qué scripts y recursos pueden cargarse; es útil contra XSS y algunos riesgos de la cadena de suministro. Considera un despliegue gradual.",
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
      title: `No se ven controles de protección de framing para ${host}`,
      explanation:
        "X-Frame-Options o CSP frame-ancestors reduce el clickjacking. Añade uno si expones páginas interactivas.",
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
      title: `No se configuró Referrer-Policy para ${host}`,
      explanation:
        "Referrer-Policy limita qué datos se filtran en la navegación saliente; es una mejora moderada en privacidad y seguridad.",
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
      title: `Permissions-Policy configurada para ${host}`,
      explanation: "Se configuraron con precisión los toggles de funciones del navegador.",
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
      ? `Se encontró el registro DNS MTA-STS (${mtaStsName})`
      : `No hay TXT MTA-STS en ${mtaStsName}`,
    explanation: hasMtaSts
      ? "MTA-STS ayuda a que los servidores de correo receptores exijan SMTP cifrado para direcciones en este nombre de host, reduciendo ataques de degradación."
      : "Sin MTA-STS, el transporte SMTP de correo para este nombre de host puede degradarse con más facilidad en tránsito; considera STS para los dominios de correo principales.",
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
      ? `Se encontró TXT de reporting TLS (TLS-RPT) (${tlsRptName})`
      : `No hay TXT TLS-RPT en ${tlsRptName}`,
    explanation: hasTlsRpt
      ? "TLS-RPT puede alertarte sobre fallas de TLS SMTP entrante; útil para visibilidad operativa."
      : "TLS-RPT es opcional, pero ayuda a detectar problemas de TLS del transporte de correo cuando se publica en _smtp._tls.",
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
      ? `Registro BIMI presente (${bimiName})`
      : `No hay registro BIMI predeterminado en ${bimiName}`,
    explanation: hasBimi
      ? "BIMI asocia el logo de la marca a correos validados; a menudo se combina con un DMARC sólido."
      : "BIMI es un señalamiento de marca opcional; su ausencia no implica por sí sola una vulnerabilidad.",
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
        title: `DNSSEC: se detectaron DNSKEY en el apex ${apex}`,
        explanation:
          "Tu zona DNS parece publicar DNSKEYs; los resolvedores que validan DNSSEC obtienen garantías de integridad más fuertes para registros firmados.",
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
        title: `No hay DNSKEY en el apex ${apex} (DNSSEC no indicado)`,
        explanation:
          "Muchas zonas siguen funcionando sin DNSSEC. Si operas infraestructura de alto riesgo, considera firmar con tu proveedor DNS.",
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
        title: `Estado de DNSSEC incierto para el apex ${apex}`,
        explanation:
          "No fue posible confirmar la presencia de DNSKEY; errores del resolvedor o vistas divididas pueden ocultar esta señal.",
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
        title: "Algunos dominios de correo pegados están fuera del apex del escaneo",
        explanation:
          "Solo se evalúan dominios de correo bajo el mismo apex registrable que el objetivo principal del escaneo. Los demás se omitieron para evitar recon de terceros.",
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
        title: "La lista de correos se truncó",
        explanation:
          "Se pegaron demasiadas entradas; solo se analizó el primer lote. Divide en múltiples escaneos si es necesario.",
        metadata: { source: "osint_passive", check: "email_cap_lines" },
      });
    }
    if (meta.truncatedUniqueDomainList) {
      out.push({
        id: `osint-passive-email-truncated-domains`,
        module: MODULE,
        severity: "low",
        title: "Se limitó el número de dominios de correo distintos",
        explanation:
          "Solo se incluyó un número limitado de dominios únicos en el OSINT. Elimina ruido o ejecuta escaneos separados.",
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
