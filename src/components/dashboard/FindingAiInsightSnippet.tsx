import type { AiPerFindingInsight } from "@/types/ai-insights";

export function FindingAiInsightSnippet({
  insight,
}: {
  insight?: AiPerFindingInsight | null;
}) {
  if (!insight || !insight.meaning.trim()) return null;

  return (
    <div className="mt-3 rounded-lg border border-indigo-500/25 bg-indigo-950/30 p-3 text-xs leading-relaxed">
      <p className="font-semibold uppercase tracking-wide text-indigo-300/95">
        AI context
      </p>
      <p className="mt-1 text-slate-300">{insight.meaning}</p>
      {insight.verifyStep?.trim() ? (
        <p className="mt-2 font-medium text-slate-200">
          <span className="font-normal text-slate-500">Verify: </span>
          {insight.verifyStep}
        </p>
      ) : null}
    </div>
  );
}
