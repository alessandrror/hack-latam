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
  title: "Hack LATAM — Superficie externa pasiva para PYMEs",
  description:
    "Comprueba en segundos qué se ve en público sobre tu dominio (transparencia de certificados, correo DNS, HTTPS). Sin explotación. Blog y guías orientadas a defensa.",
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
