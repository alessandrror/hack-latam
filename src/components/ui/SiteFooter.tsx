import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-sm font-semibold text-foreground">Hack LATAM</p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Visibilidad defensiva de tu huella externa para PYMEs: solo señales
            públicas y pasivas; sin explotación ni pentest.
          </p>
        </div>
        <nav className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link href="/scan" className="hover:text-accent">
            Escanear
          </Link>
          <Link href="/blog" className="hover:text-accent">
            Blog
          </Link>
          <Link href="/#newsletter" className="hover:text-accent">
            Newsletter
          </Link>
        </nav>
      </div>
      <p className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Hack LATAM · hackathon def/acc · resiliencia defensiva
      </p>
    </footer>
  );
}
