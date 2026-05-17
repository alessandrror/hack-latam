import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-cyan-500/10 bg-[#020206]/90">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-sm font-semibold text-slate-200">Hack LATAM</p>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            Reconocimiento pasivo de superficie de ataque para PYMEs. Solo datos
            públicos — sin explotación.
          </p>
        </div>
        <nav className="flex flex-wrap gap-4 text-sm text-slate-500">
          <Link href="/scan" className="hover:text-cyan-300">
            Escanear
          </Link>
          <Link href="/blog" className="hover:text-cyan-300">
            Blog
          </Link>
          <Link href="/#newsletter" className="hover:text-cyan-300">
            Newsletter
          </Link>
        </nav>
      </div>
      <p className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} Hack LATAM — Hackathon defense track
      </p>
    </footer>
  );
}
