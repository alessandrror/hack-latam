import { ConvexClerkProvider } from "@/components/providers/ConvexClerkProvider";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Hack LATAM — Instantáneo pasivo de huella observable para PYMEs",
  description:
    "Cuando eliges modo y ejecutas el escaneo, obtienes un resultado determinístico a partir de señales públicas: correo en DNS (SPF/DMARC/DKIM), HTTPS en :443 y, en modo profundo, huella por transparencia de certificados. Sin explotación ni inventario garantizado; la IA opcional solo orienta sobre los hallazgos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <ClerkProvider dynamic>
          <ConvexClerkProvider>{children}</ConvexClerkProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
