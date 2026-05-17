"use client";

import {
  SignInButton,
  UserButton,
  useAuth,
} from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/scan", label: "Escanear" },
  { href: "/blog", label: "Blog" },
] as const;

export function SiteHeader() {
  const { isLoaded, userId } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  const showAuthControls = mounted && isLoaded;

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
        <div className="flex items-center gap-2 sm:gap-3">
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Principal">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "lg" }),
                  "rounded-lg px-3 py-2 text-slate-400 hover:bg-cyan-500/10 hover:text-cyan-200",
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/scan"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "btn-gradient-neon ml-1 hidden rounded-lg px-4 py-2 sm:inline-flex",
              )}
            >
              Iniciar escaneo
            </Link>
          </nav>
          <div className="flex items-center gap-2 border-l border-cyan-500/15 pl-2 sm:pl-3">
            {!showAuthControls ? (
              <span
                className="flex h-9 w-24 shrink-0 items-center justify-center rounded-lg bg-slate-800/50"
                aria-hidden
              />
            ) : userId ? (
              <UserButton
                appearance={{
                  variables: {
                    colorBackground: "#0a1628",
                    colorText: "#e2e8f0",
                    colorTextSecondary: "#94a3b8",
                  },
                  elements: {
                    userButtonPopoverCard:
                      "border border-cyan-500/20 bg-[#071018]",
                  },
                }}
              />
            ) : (
              <SignInButton mode="modal">
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  className="rounded-lg px-3 py-2 text-cyan-200/95 hover:bg-cyan-500/10 hover:text-cyan-100"
                >
                  Entrar
                </Button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
