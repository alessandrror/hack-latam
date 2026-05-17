"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

/**
 * Minimal scan-route header: home + thin branding, theme, auth. No site nav links.
 */
export function ScanAppChrome() {
  const { isLoaded, userId } = useAuth();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const clerkAppearance = useMemo(
    () =>
      resolvedTheme === "light"
        ? {
            variables: {
              colorBackground: "#ffffff",
              colorText: "#0f172a",
              colorTextSecondary: "#64748b",
            },
            elements: {
              userButtonPopoverCard: "border border-border bg-card shadow-md",
            },
          }
        : {
            variables: {
              colorBackground: "#1e293b",
              colorText: "#f8fafc",
              colorTextSecondary: "#cbd5e1",
            },
            elements: {
              userButtonPopoverCard: "border border-border bg-card shadow-md",
            },
          },
    [resolvedTheme],
  );

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  const showAuthControls = mounted && isLoaded;

  return (
    <header className="sticky top-0 z-50 shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-none items-center justify-between gap-3 px-3 sm:px-4">
        <Link
          href="/"
          className="group flex min-h-9 shrink-0 items-center gap-2 rounded-lg py-1 pr-2 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span className="flex size-8 items-center justify-center rounded-full border border-border bg-muted text-xs font-bold text-primary">
            H
          </span>
          <span className="flex flex-col leading-none">
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-accent sm:block">
              Hack LATAM
            </span>
            <span className="text-xs font-medium text-muted-foreground sm:text-sm sm:text-foreground">
              Escanear
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <div className="flex items-center border-l border-border/60 pl-1 sm:pl-2">
            {!showAuthControls ? (
              <span
                className="flex h-8 w-20 shrink-0 items-center justify-center rounded-md bg-muted"
                aria-hidden
              />
            ) : userId ? (
              <UserButton appearance={clerkAppearance} />
            ) : (
              <SignInButton mode="modal">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 shrink-0 px-3 text-foreground hover:bg-muted"
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
