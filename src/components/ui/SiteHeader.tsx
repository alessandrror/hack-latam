import Link from "next/link";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/scan", label: "Escanear" },
  { href: "/blog", label: "Blog" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-cyan-500/15 bg-[#030308]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/10 text-sm font-bold text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.25)]">
            H
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400/90">
              Hack LATAM
            </span>
            <span className="text-sm font-medium text-slate-200">
              Cyber Twin Protocol
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Principal">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-cyan-500/10 hover:text-cyan-200"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/scan"
            className="ml-1 hidden rounded-lg btn-gradient-neon px-4 py-2 text-sm sm:inline-flex"
          >
            Iniciar escaneo
          </Link>
        </nav>
      </div>
    </header>
  );
}
