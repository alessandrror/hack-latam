import { ConvexClerkProvider } from "@/components/providers/ConvexClerkProvider";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <ClerkProvider dynamic>
          <ConvexClerkProvider>{children}</ConvexClerkProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
