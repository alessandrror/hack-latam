import { ScanWorkspace } from "@/components/scan/ScanWorkspace";
import { CyberBackground } from "@/components/ui/CyberBackground";
import { SiteHeader } from "@/components/ui/SiteHeader";

export const metadata = {
  title: "Analizar dominio — Hack LATAM",
  description:
    "Comprobaciones pasivas sobre tu huella externa en un solo resultado: DNS de correo, HTTPS y datos públicos. Solo activos que puedas escanear con autorización.",
};

export default function ScanPage() {
  return (
    <CyberBackground>
      <SiteHeader />
      <main className="min-h-[calc(100dvh-4rem)]">
        <ScanWorkspace />
      </main>
    </CyberBackground>
  );
}
