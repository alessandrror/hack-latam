import type {
  AiInsightsRequestBody,
  AiInsightsResponseBody,
  AiInsightsTopAction,
} from "@/types/ai-insights";

export type SuggestedChatChip = {
  id: string;
  label: string;
  prompt: string;
};

const MAX_CHIPS = 8;
const MIN_CHIPS = 5;

const FALLBACK_CHIPS: SuggestedChatChip[] = [
  {
    id: "fallback-critical",
    label: "Explicar hallazgos críticos",
    prompt:
      "Explica en español los hallazgos críticos y medios de este escaneo y por qué importan para una PYME.",
  },
  {
    id: "fallback-priority",
    label: "Qué verificar primero",
    prompt:
      "Dado mi tiempo limitado, ¿qué debería verificar primero esta semana según el resumen? Cita ids de hallazgos.",
  },
  {
    id: "fallback-handoff",
    label: "Texto para proveedor",
    prompt:
      "Redacta bullets cortos que pueda enviar a mi proveedor DNS/hosting para corregir lo detectado en este escaneo.",
  },
  {
    id: "fallback-scope",
    label: "Límites del escaneo",
    prompt:
      "¿Qué no cubrió este escaneo pasivo y qué no debo asumir como seguro?",
  },
];

function truncateLabel(text: string, max = 32): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

function chipFromTopAction(action: AiInsightsTopAction): SuggestedChatChip {
  const related =
    action.relatedFindingIds && action.relatedFindingIds.length > 0
      ? ` Relaciona hallazgos: ${action.relatedFindingIds.join(", ")}.`
      : "";
  return {
    id: `action-${action.id}`,
    label: truncateLabel(action.title),
    prompt: `Amplía en español la acción prioritaria «${action.title}»: por qué importa (${action.why}) y cómo verificar paso a paso (${action.verifyStep}).${related}`,
  };
}

function findingChips(
  findings: AiInsightsRequestBody["findings"],
  perFinding: AiInsightsResponseBody["perFindingInsightsById"],
): SuggestedChatChip[] {
  const chips: SuggestedChatChip[] = [];
  const ranked = [...findings].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    const sa = order[a.severity as keyof typeof order] ?? 5;
    const sb = order[b.severity as keyof typeof order] ?? 5;
    return sa - sb;
  });

  for (const f of ranked.slice(0, 4)) {
    const insight = perFinding[f.id];
    const meaning = insight?.meaning?.trim();
    chips.push({
      id: `finding-${f.id}`,
      label: truncateLabel(f.title, 36),
      prompt: meaning
        ? `Sobre el hallazgo «${f.title}» (${f.id}): el resumen dice «${meaning}». ¿Qué debo hacer esta semana y qué riesgo tiene para una PYME si no lo corrijo?`
        : `Explica en español el hallazgo «${f.title}» (${f.id}, severidad ${f.severity}) y qué pasos defensivos recomiendas.`,
    });
  }
  return chips;
}

function moduleSpecificChips(
  findings: AiInsightsRequestBody["findings"],
  target: string,
): SuggestedChatChip[] {
  const chips: SuggestedChatChip[] = [];
  const titles = findings.map((f) => f.title.toLowerCase()).join(" ");

  if (/spf|dmarc|dkim|dns|mail/.test(titles)) {
    chips.push({
      id: "module-email",
      label: "Correo y autenticación",
      prompt: `Para ${target}, resume qué falla en SPF/DMARC/DKIM según el escaneo y redacta un mensaje breve para mi proveedor de correo o DNS.`,
    });
  }
  if (/tls|ssl|certificate|https|hsts/.test(titles)) {
    chips.push({
      id: "module-tls",
      label: "TLS y certificados",
      prompt: `Según los hallazgos de TLS/HTTPS en ${target}, ¿qué debo pedir a hosting o CDN y en qué orden?`,
    });
  }
  if (/subdomain|ct |certificate transparency|hostname/.test(titles)) {
    chips.push({
      id: "module-surface",
      label: "Superficie expuesta",
      prompt: `Con ${findings.length} hallazgos en superficie, ¿qué subdominios o activos debería revisar primero en ${target}?`,
    });
  }
  return chips;
}

export function buildSuggestedChatPrompts(params: {
  priorInsights: AiInsightsResponseBody;
  scanSnapshot: AiInsightsRequestBody;
}): SuggestedChatChip[] {
  const { priorInsights, scanSnapshot } = params;
  const target = scanSnapshot.normalizedTarget;
  const seen = new Set<string>();
  const out: SuggestedChatChip[] = [];

  const push = (chip: SuggestedChatChip) => {
    if (seen.has(chip.id)) return;
    seen.add(chip.id);
    out.push(chip);
  };

  push({
    id: "summary-steps",
    label: "Plan de 3 pasos",
    prompt: `A partir del resumen ejecutivo de ${target}, dame solo 3 pasos concretos para esta semana (sin jerga técnica innecesaria).`,
  });

  for (const action of priorInsights.topActions.slice(0, 3)) {
    push(chipFromTopAction(action));
  }

  for (const chip of findingChips(
    scanSnapshot.findings,
    priorInsights.perFindingInsightsById,
  )) {
    if (out.length >= MAX_CHIPS) break;
    push(chip);
  }

  for (const chip of moduleSpecificChips(scanSnapshot.findings, target)) {
    if (out.length >= MAX_CHIPS) break;
    push(chip);
  }

  if (
    scanSnapshot.checklistRows &&
    scanSnapshot.checklistRows.length > 0 &&
    scanSnapshot.scanMode !== "quick"
  ) {
    push({
      id: "checklist-gaps",
      label: "Huecos del checklist",
      prompt:
        "Según el checklist del escaneo profundo, ¿qué filas están en fail o warn y qué debería validar manualmente antes de dar por cerrado el tema?",
    });
  }

  if (scanSnapshot.totalHostnames > 0) {
    push({
      id: "hostnames",
      label: `Activos (${scanSnapshot.totalHostnames})`,
      prompt: `Detectamos ${scanSnapshot.totalHostnames} nombres de host relacionados con ${target}. ¿Cómo priorizo cuáles revisar y qué riesgos típicos buscar?`,
    });
  }

  push({
    id: "executive-deep",
    label: "Profundizar resumen",
    prompt: `Resume en español claro el siguiente análisis y dime qué NO está cubierto: «${priorInsights.executiveSummary.slice(0, 400)}${priorInsights.executiveSummary.length > 400 ? "…" : ""}»`,
  });

  for (const fallback of FALLBACK_CHIPS) {
    if (out.length >= MAX_CHIPS) break;
    push(fallback);
  }

  return out.slice(0, MAX_CHIPS).length >= MIN_CHIPS
    ? out.slice(0, MAX_CHIPS)
    : [
        ...out,
        ...FALLBACK_CHIPS.filter((c) => !seen.has(c.id)),
      ].slice(0, MAX_CHIPS);
}
