"use client";

import {
  SignInButton,
  UserButton,
  useAuth,
} from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/scan", label: "Escanear" },
  { href: "/blog", label: "Blog" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const { isLoaded, userId } = useAuth();
  const [mounted, setMounted] = useState(false);
  const hideScanCta = pathname === "/scan";

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  const showAuthControls = mounted && isLoaded;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted text-sm font-bold text-primary">
            H
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Hack LATAM
            </span>
            <span className="text-sm font-medium text-foreground">
              Superficie externa pasiva
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
                  "rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
            {!hideScanCta ? (
              <Link
                href="/scan"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "ml-1 hidden rounded-lg px-4 py-2 sm:inline-flex",
                )}
              >
                Analizar dominio
              </Link>
            ) : null}
          </nav>
          <div className="flex items-center gap-2 border-l border-border pl-2 sm:pl-3">
            {!showAuthControls ? (
              <span
                className="flex h-9 w-24 shrink-0 items-center justify-center rounded-lg bg-muted"
                aria-hidden
              />
            ) : userId ? (
              <UserButton
                appearance={{
                  variables: {
                    colorBackground: "#ffffff",
                    colorText: "#0f172a",
                    colorTextSecondary: "#64748b",
                  },
                  elements: {
                    userButtonPopoverCard: "border border-border bg-card shadow-md",
                  },
                }}
              />
            ) : (
              <SignInButton mode="modal">
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  className="rounded-lg px-3 py-2 text-foreground hover:bg-muted"
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
