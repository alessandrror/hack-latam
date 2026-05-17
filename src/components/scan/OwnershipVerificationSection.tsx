"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Copy, Loader2, ShieldCheck } from "lucide-react";
import { useCallback, useState } from "react";

export type VerificationMethod = "dns_txt" | "http_file";

export type VerificationSnapshot = {
  status: "pending" | "verified" | "failed";
  method: VerificationMethod;
  token?: string;
  failureReason?: string;
} | null;

type OwnershipVerificationSectionProps = {
  apexDomain: string;
  /** Live row from Convex `getStatus`, or null if none */
  verification: VerificationSnapshot;
  disabled?: boolean;
  onVerified: () => void;
};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function OwnershipVerificationSection({
  apexDomain,
  verification,
  disabled,
  onVerified,
}: OwnershipVerificationSectionProps) {
  const [method, setMethod] = useState<VerificationMethod>("dns_txt");
  const [initLoading, setInitLoading] = useState(false);
  const [checkLoading, setCheckLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [copyHint, setCopyHint] = useState<string | null>(null);

  const dnsHost = `_hack-latam-verify.${apexDomain}`;
  const httpUrl = `https://${apexDomain}/.well-known/hack-latam-challenge.txt`;

  const token =
    verification?.status === "pending" ? verification.token : undefined;

  const handleInitiate = useCallback(async () => {
    setLocalError(null);
    setCopyHint(null);
    setInitLoading(true);
    try {
      const response = await fetch("/api/verify/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: apexDomain, method }),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const err =
          typeof body === "object" &&
          body !== null &&
          "error" in body &&
          typeof (body as { error: unknown }).error === "string"
            ? (body as { error: string }).error
            : "No se pudo iniciar la verificación.";
        setLocalError(err);
        return;
      }
      const payload = body as { alreadyVerified?: boolean };
      if (payload.alreadyVerified) {
        onVerified();
      }
    } catch {
      setLocalError("Error de red — inténtalo de nuevo.");
    } finally {
      setInitLoading(false);
    }
  }, [apexDomain, method, onVerified]);

  const handleCheck = useCallback(async () => {
    setLocalError(null);
    setCheckLoading(true);
    try {
      const response = await fetch("/api/verify/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: apexDomain }),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const err =
          typeof body === "object" &&
          body !== null &&
          "error" in body &&
          typeof (body as { error: unknown }).error === "string"
            ? (body as { error: string }).error
            : "La comprobación falló.";
        setLocalError(err);
        return;
      }
      const payload = body as { ok?: boolean; appliedStatus?: string };
      if (payload.ok && payload.appliedStatus === "verified") {
        onVerified();
        return;
      }
      if (typeof payload === "object" && payload !== null && "message" in payload) {
        const msg = (payload as { message?: unknown }).message;
        if (typeof msg === "string" && msg.length > 0) {
          setLocalError(msg);
        }
      }
    } catch {
      setLocalError("Error de red — inténtalo de nuevo.");
    } finally {
      setCheckLoading(false);
    }
  }, [apexDomain, onVerified]);

  const onCopy = async (label: string, value: string) => {
    const ok = await copyText(value);
    setCopyHint(ok ? `${label} copiado` : "No se pudo copiar");
    setTimeout(() => setCopyHint(null), 2200);
  };

  return (
    <div
      className={cn(
        "space-y-4 rounded-2xl border border-border/60 bg-muted/20 px-4 py-4 text-left",
        "dark:bg-muted/10",
      )}
    >
      <div className="flex items-start gap-2.5">
        <ShieldCheck
          className="mt-0.5 size-5 shrink-0 text-primary"
          aria-hidden
        />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            Verificación de titularidad (modo profundo)
          </p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Apex verificado:{" "}
            <span className="font-mono text-foreground">{apexDomain}</span>.
            Publica el token y confirma con el botón inferior. Solo objetivos
            autorizados — pasivo, como en el descargo del escáner.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={
            Boolean(disabled) ||
            initLoading ||
            verification?.status === "pending"
          }
          onClick={() => setMethod("dns_txt")}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
            method === "dns_txt"
              ? "border-primary/50 bg-primary/10 text-foreground"
              : "border-border/60 bg-background text-muted-foreground hover:bg-muted/40",
          )}
        >
          DNS TXT
        </button>
        <button
          type="button"
          disabled={
            Boolean(disabled) ||
            initLoading ||
            verification?.status === "pending"
          }
          onClick={() => setMethod("http_file")}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
            method === "http_file"
              ? "border-primary/50 bg-primary/10 text-foreground"
              : "border-border/60 bg-background text-muted-foreground hover:bg-muted/40",
          )}
        >
          Archivo HTTPS
        </button>
      </div>

      {verification?.status === "failed" && verification.failureReason ? (
        <p className="text-xs text-destructive" role="alert">
          {verification.failureReason}
        </p>
      ) : null}

      {localError ? (
        <p className="text-xs text-destructive" role="alert">
          {localError}
        </p>
      ) : null}

      {copyHint ? (
        <p className="text-[11px] text-muted-foreground" role="status">
          {copyHint}
        </p>
      ) : null}

      {!token ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full rounded-full"
          disabled={Boolean(disabled) || initLoading}
          onClick={() => void handleInitiate()}
        >
          {initLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Preparando…
            </>
          ) : verification?.status === "failed" ? (
            "Reiniciar verificación (nuevo token)"
          ) : (
            <>Obtener instrucciones y token</>
          )}
        </Button>
      ) : (
        <div className="space-y-3 text-[11px] leading-relaxed text-muted-foreground">
          {verification?.method === "dns_txt" ? (
            <div className="space-y-2 rounded-xl border border-border/50 bg-background/60 p-3">
              <p className="font-medium text-foreground">Registro TXT</p>
              <p>
                Nombre / host:{" "}
                <span className="font-mono text-foreground">{dnsHost}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-1 size-7"
                  aria-label="Copiar host TXT"
                  onClick={() => void onCopy("Host", dnsHost)}
                >
                  <Copy className="size-3.5" />
                </Button>
              </p>
              <p>
                Valor (exacto):{" "}
                <span className="break-all font-mono text-foreground">
                  {token}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-1 size-7"
                  aria-label="Copiar token"
                  onClick={() => void onCopy("Token", token)}
                >
                  <Copy className="size-3.5" />
                </Button>
              </p>
            </div>
          ) : (
            <div className="space-y-2 rounded-xl border border-border/50 bg-background/60 p-3">
              <p className="font-medium text-foreground">Archivo en HTTPS</p>
              <p>
                URL:{" "}
                <span className="break-all font-mono text-foreground">
                  {httpUrl}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-1 size-7"
                  aria-label="Copiar URL"
                  onClick={() => void onCopy("URL", httpUrl)}
                >
                  <Copy className="size-3.5" />
                </Button>
              </p>
              <p>
                Contenido del archivo:{" "}
                <span className="break-all font-mono text-foreground">
                  {token}
                </span>
                (solo el token, sin espacios ni saltos extra)
              </p>
            </div>
          )}

          <Button
            type="button"
            size="sm"
            className="h-10 w-full rounded-full"
            disabled={Boolean(disabled) || checkLoading}
            onClick={() => void handleCheck()}
          >
            {checkLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Comprobando…
              </>
            ) : (
              "Ya lo publiqué — verificar ahora"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
