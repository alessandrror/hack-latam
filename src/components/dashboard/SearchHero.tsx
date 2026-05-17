import type { FormEvent } from "react";

type SearchHeroProps = {
  target: string;
  onTargetChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  error: string | null;
  inputId?: string;
};

export function SearchHero({
  target,
  onTargetChange,
  onSubmit,
  loading,
  error,
  inputId = "target-hero",
}: SearchHeroProps) {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col justify-center px-6 py-16">
      <div className="mx-auto w-full max-w-xl space-y-8 text-center">
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-widest text-emerald-500/90">
            Hack LATAM — Recon dashboard
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            See what the internet already knows about a domain
          </h1>
          <p className="text-base leading-relaxed text-slate-400 sm:text-lg">
            Passive checks only — certificate transparency names, DNS email-auth
            signals (SPF / DMARC / DKIM hints), and a simple HTTPS certificate
            readout — explained in plain language.
          </p>
        </header>

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-left shadow-xl shadow-black/20 backdrop-blur-sm"
        >
          <label htmlFor={inputId} className="text-sm font-medium text-slate-200">
            Target domain or URL
          </label>
          <input
            id={inputId}
            name="target"
            value={target}
            onChange={(e) => onTargetChange(e.target.value)}
            placeholder="example.com or https://www.example.com"
            className="min-h-11 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-base text-slate-50 outline-none ring-emerald-500/40 transition focus:border-emerald-500/50 focus:ring-2"
            autoComplete="off"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !target.trim()}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-emerald-600/50 bg-emerald-600 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Scanning…" : "Start scan"}
          </button>
          {error ? (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
