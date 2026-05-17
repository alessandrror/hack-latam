import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-sm font-semibold text-foreground">Hack LATAM</p>
          <p className="mt-1 max-w-sm text-xs text-foreground/65">
            Instantáneo pasivo tras enviar dominio autorizado — correo público en DNS,
            HTTPS observable y huella CT según modo. Sin explotación, sin vigilancia ante
            atacantes y sin equivalencia a auditoría integral.
          </p>
        </div>
        <nav className="flex flex-wrap gap-4 text-sm font-medium text-foreground/75">
          <Link href="/scan" className="underline-offset-4 hover:text-accent hover:underline">
            Escanear
          </Link>
          <Link href="/blog" className="underline-offset-4 hover:text-accent hover:underline">
            Blog
          </Link>
          <Link
            href="/#newsletter"
            className="underline-offset-4 hover:text-accent hover:underline"
          >
            Newsletter
          </Link>
        </nav>
      </div>
      <p className="border-t border-border py-4 text-center text-xs text-foreground/60">
        © {new Date().getFullYear()} Hack LATAM · proyecto def/acc · resiliencia observable
      </p>
    </footer>
  );
}
