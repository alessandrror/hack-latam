import { promises as dns } from "node:dns";

import type { ScanFinding } from "@/types/scan";

type CaaRecords = Awaited<ReturnType<typeof dns.resolveCaa>>;

function formatCaaRecords(
  records: CaaRecords,
): { issue?: string[]; issuewild?: string[] } {
  const issue: string[] = [];
  const issuewild: string[] = [];
  for (const r of records) {
    if (typeof r.issue === "string" && r.issue) issue.push(r.issue);
    if (typeof r.issuewild === "string" && r.issuewild)
      issuewild.push(r.issuewild);
  }
  const out: { issue?: string[]; issuewild?: string[] } = {};
  if (issue.length) out.issue = [...new Set(issue)];
  if (issuewild.length) out.issuewild = [...new Set(issuewild)];
  return out;
}

/**
 * Deep-only: CAA records control which CAs may issue certificates for the domain.
 */
export async function collectDnsCaaFindings(domain: string): Promise<ScanFinding[]> {
  const trimmed = domain.trim().toLowerCase();
  if (!trimmed) return [];

  let records: CaaRecords = [];
  try {
    records = await dns.resolveCaa(trimmed);
  } catch {
    records = [];
  }

  const caaPresent = records.length > 0;
  const formatted = caaPresent ? formatCaaRecords(records) : {};
  const hasRules = Boolean(formatted.issue?.length || formatted.issuewild?.length);

  const severity = "low" as const;
  const title = caaPresent
    ? "Se publicaron registros CAA para controlar la emisión de certificados"
    : "No se encontraron registros CAA";

  const explanation = caaPresent
    ? hasRules
      ? "CAA le indica a las CA públicas qué autoridades pueden emitir certificados para tu dominio; reduce el riesgo de certificados mal emitidos si el DNS está protegido."
      : "Se devolvieron registros con formato CAA, pero los campos etiquetados estaban vacíos en la vista del resolvedor. Verifica con tu administrador DNS que se configuraron los valores issue/issuewild previstos."
    : "Sin CAA, cualquier CA que pueda validar el control podría emitir para este nombre (sujeto a las reglas normales de las CA). Agregar CAA es un refuerzo opcional para muchas PYMEs.";

  const finding: ScanFinding = {
    id: `dns-caa-${trimmed}`,
    module: "dns_caa",
    severity,
    title,
    explanation,
    metadata: {
      hostname: trimmed,
      caaPresent,
      ...(Object.keys(formatted).length > 0 ? formatted : {}),
      recordCount: records.length,
    },
  };

  return [finding];
}
