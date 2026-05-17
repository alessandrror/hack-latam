import { apexBypassesOwnershipVerification } from "@/lib/verify/ownership-bypass";
import { classifyAndNormalizeTarget } from "@/lib/recon/normalize-target";
import { extractApexFromNormalizedHost } from "@/lib/recon/extract-apex";
import { api, convexAuthedClient } from "@/lib/convex-server";
import { runScanModules } from "@/lib/recon/run-scan";
import type { ScanMode, ScanResponseBody } from "@/types/scan";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const target =
    typeof body === "object" &&
    body !== null &&
    "target" in body &&
    typeof (body as { target: unknown }).target === "string"
      ? (body as { target: string }).target
      : "";

  const rawMode =
    typeof body === "object" &&
    body !== null &&
    "mode" in body &&
    typeof (body as { mode: unknown }).mode === "string"
      ? (body as { mode: string }).mode.trim().toLowerCase()
      : "";
  const mode: ScanMode = rawMode === "quick" ? "quick" : "deep";

  const { kind, normalized } = classifyAndNormalizeTarget(target);
  if (!normalized || kind === "unknown") {
    return NextResponse.json(
      {
        error:
          "Enter a domain name or URL (for example example.com or https://example.com).",
      },
      { status: 400 },
    );
  }

  if (mode === "deep") {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          error:
            "El modo profundo requiere sesión iniciada. Entra o usa el modo rápido.",
          code: "AUTH_REQUIRED",
        },
        { status: 401 },
      );
    }

    if (kind === "ip") {
      return NextResponse.json(
        {
          error:
            "El modo profundo no está disponible para direcciones IP. Usa el modo rápido o un nombre de dominio.",
          code: "DEEP_IP_NOT_ALLOWED",
        },
        { status: 400 },
      );
    }

    const apex = extractApexFromNormalizedHost(normalized);
    if (!apex) {
      return NextResponse.json(
        {
          error: "No se pudo determinar el dominio raíz para comprobar la titularidad.",
          code: "APEX_UNKNOWN",
        },
        { status: 400 },
      );
    }

    if (!apexBypassesOwnershipVerification(apex)) {
      try {
        const client = await convexAuthedClient();
        const verification = await client.query(api.verifiedDomains.getStatus, {
          domain: apex,
        });
        if (!verification || verification.status !== "verified") {
          return NextResponse.json(
            {
              error:
                "Debes verificar la titularidad del dominio antes de un escaneo profundo.",
              code: "OWNERSHIP_REQUIRED",
              apex,
            },
            { status: 403 },
          );
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg === "Unauthorized" || msg.includes("Unauthorized")) {
          return NextResponse.json(
            {
              error: "Sesión no válida para comprobar la titularidad.",
              code: "AUTH_REQUIRED",
            },
            { status: 401 },
          );
        }
        if (msg.includes("NEXT_PUBLIC_CONVEX_URL")) {
          return NextResponse.json(
            { error: "Convex no está configurado.", code: "CONFIG" },
            { status: 500 },
          );
        }
        throw e;
      }
    }
  }

  const { modules, findings } = await runScanModules({
    normalizedTarget: normalized,
    inputKind: kind,
    mode,
  });

  const payload: ScanResponseBody = {
    target,
    normalizedTarget: normalized,
    inputKind: kind,
    mode,
    findings,
    modules,
  };

  return NextResponse.json(payload);
}
