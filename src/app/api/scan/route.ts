import { apexBypassesOwnershipVerification } from "@/lib/verify/ownership-bypass";
import { classifyAndNormalizeTarget } from "@/lib/recon/normalize-target";
import { extractApexFromNormalizedHost } from "@/lib/recon/extract-apex";
import {
  buildPassiveOsintHostnames,
  classifyHostsByPrimaryApex,
  normalizeEmailsPayload,
  parseEmailLinesForDomains,
} from "@/lib/recon/email-domains";
import { api, convexAuthedClient } from "@/lib/convex-server";
import { runScanModules } from "@/lib/recon/run-scan";
import type { EmailDomainSummary, ScanMode, ScanResponseBody } from "@/types/scan";
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

  const emailsPayload =
    typeof body === "object" && body !== null && "emails" in body
      ? (body as { emails?: unknown }).emails
      : undefined;
  const emailsRaw = normalizeEmailsPayload(emailsPayload);
  const trimmedEmails = emailsRaw.trim();

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

  const primaryApexFromTarget =
    kind === "domain" ? extractApexFromNormalizedHost(normalized) : null;

  let emailDomainSummary: EmailDomainSummary | undefined;
  let eligibleFromEmails: string[] = [];
  let skippedExternalFromEmails: string[] = [];

  let parsedEmailMeta = {
    parsedLineCount: 0,
    truncatedEmailList: false,
    truncatedDomainList: false,
  };

  if (trimmedEmails !== "") {
    const parsed = parseEmailLinesForDomains(trimmedEmails);
    parsedEmailMeta = {
      parsedLineCount: parsed.parsedLineCount,
      truncatedEmailList: parsed.truncatedEmailList,
      truncatedDomainList: parsed.truncatedDomainList,
    };
    const classified = classifyHostsByPrimaryApex(
      primaryApexFromTarget,
      parsed.uniqueHosts,
    );
    eligibleFromEmails = classified.eligible;
    skippedExternalFromEmails = classified.skippedExternal;
    emailDomainSummary = {
      primaryApex: primaryApexFromTarget,
      eligibleEmailDomains: [...eligibleFromEmails],
      skippedExternalDomains: [...skippedExternalFromEmails],
      parsedEmailLineCount: parsedEmailMeta.parsedLineCount,
      truncatedEmailList: parsedEmailMeta.truncatedEmailList,
      truncatedUniqueDomainList: parsedEmailMeta.truncatedDomainList,
    };
  }

  const osintHostnames = buildPassiveOsintHostnames({
    primaryNormalizedHost: kind === "domain" ? normalized : null,
    inputKind: kind,
    classifiedEligibleEmailHosts: eligibleFromEmails,
  });

  const emailOsintMeta =
    trimmedEmails !== ""
      ? {
          skippedExternalDomains: skippedExternalFromEmails,
          truncatedEmailList: parsedEmailMeta.truncatedEmailList,
          truncatedUniqueDomainList: parsedEmailMeta.truncatedDomainList,
        }
      : undefined;

  const { modules, findings } = await runScanModules({
    normalizedTarget: normalized,
    inputKind: kind,
    mode,
    primaryApex: primaryApexFromTarget,
    osintHostnames,
    emailOsintMeta,
  });

  const payload: ScanResponseBody = {
    target,
    normalizedTarget: normalized,
    inputKind: kind,
    mode,
    findings,
    modules,
    ...(emailDomainSummary ? { emailDomainSummary } : {}),
  };

  if (trimmedEmails !== "") {
    try {
      const client = await convexAuthedClient();
      await client.mutation(api.emailDomainSummaries.recordEmailDomainSummary, {
        target,
        normalizedTarget: normalized,
        scanMode: mode,
        primaryApex: primaryApexFromTarget,
        eligibleEmailDomains: eligibleFromEmails,
        skippedExternalDomains: skippedExternalFromEmails,
        parsedEmailLineCount: parsedEmailMeta.parsedLineCount,
        truncatedEmailList: parsedEmailMeta.truncatedEmailList,
        truncatedUniqueDomainList: parsedEmailMeta.truncatedDomainList,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (
        msg !== "Unauthorized" &&
        !msg.includes("Unauthorized") &&
        !msg.includes("NEXT_PUBLIC_CONVEX_URL")
      ) {
        console.error("[scan] emailDomainSummaries persist failed:", e);
      }
    }
  }

  return NextResponse.json(payload);
}
