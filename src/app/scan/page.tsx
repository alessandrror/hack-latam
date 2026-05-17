import { ScanWorkspace } from "@/components/scan/ScanWorkspace";
import { CyberBackground } from "@/components/ui/CyberBackground";
import { SiteHeader } from "@/components/ui/SiteHeader";

export const metadata = {
  title: "Escanear — Hack LATAM",
  description: "Reconocimiento pasivo de superficie de ataque",
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
