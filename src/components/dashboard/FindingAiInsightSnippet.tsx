import type { AiPerFindingInsight } from "@/types/ai-insights";

export function FindingAiInsightSnippet({
  insight,
}: {
  insight?: AiPerFindingInsight | null;
}) {
  if (!insight || !insight.meaning.trim()) return null;

  return (
    <div className="mt-3 w-full rounded-lg border border-accent/20 bg-accent/5 p-3 text-xs leading-relaxed">
      <p className="font-semibold uppercase tracking-wide text-accent">
        Contexto IA
      </p>
      <p className="mt-1 text-foreground">{insight.meaning}</p>
      {insight.verifyStep?.trim() ? (
        <p className="mt-2 font-medium text-foreground">
          <span className="font-normal text-muted-foreground">Verificar: </span>
          {insight.verifyStep}
        </p>
      ) : null}
    </div>
  );
}
