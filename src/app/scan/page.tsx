import { ScanAppChrome } from "@/components/scan/ScanAppChrome";
import { ScanWorkspace } from "@/components/scan/ScanWorkspace";

export const metadata = {
  title: "Analizar dominio — Hack LATAM",
  description:
    "Genera un instantáneo pasivo después de definir modo y objetivo autorizado: correo en DNS público y HTTPS observable; modo profundo añade detalle SPF/DMARC, TLS heredados, registros CAA y huella vía CT. No es tiempo real ni vigilancia de intrusos.",
};

type PageProps = {
  searchParams: Promise<{ target?: string | string[] }>;
};

export default async function ScanPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const raw = params.target;
  const initialTarget =
    typeof raw === "string"
      ? raw.trim().slice(0, 256)
      : Array.isArray(raw) && raw[0]
        ? String(raw[0]).trim().slice(0, 256)
        : "";
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <ScanAppChrome />
      <main className="flex min-h-0 flex-1 flex-col">
        <ScanWorkspace
          key={initialTarget === "" ? "no-target" : initialTarget}
          initialTarget={initialTarget}
        />
      </main>
    </div>
  );
}
