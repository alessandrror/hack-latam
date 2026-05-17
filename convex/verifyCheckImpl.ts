import { actionGeneric } from "convex/server";
import { v } from "convex/values";

/** Strip common TXT quoting from DNS JSON APIs. */
function normalizeTxtRecord(data: string): string {
  let s = data.trim();
  if (s.startsWith('"') && s.endsWith('"') && s.length >= 2) {
    s = s.slice(1, -1);
  }
  return s.trim();
}

async function verifyDnsTxt(hostname: string, expectedToken: string): Promise<{
  ok: boolean;
  reason?: string;
}> {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(
    hostname,
  )}&type=TXT`;
  const res = await fetch(url, {
    headers: { accept: "application/dns-json" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) {
    return {
      ok: false,
      reason: `DNS lookup falló (HTTP ${res.status}).`,
    };
  }
  const json = (await res.json()) as {
    Status?: number;
    Answer?: { data?: string }[];
  };
  const answers = json.Answer ?? [];
  const chunks: string[] = [];
  for (const a of answers) {
    if (typeof a.data === "string") {
      chunks.push(normalizeTxtRecord(a.data));
    }
  }
  const combined = chunks.join("");
  if (combined === expectedToken) {
    return { ok: true };
  }
  if (chunks.some((c) => c === expectedToken)) {
    return { ok: true };
  }
  return {
    ok: false,
    reason:
      "No se encontró el token en el TXT. Comprueba el registro _hack-latam-verify y la propagación DNS.",
  };
}

async function verifyHttpFile(
  apexDomain: string,
  expectedToken: string,
): Promise<{ ok: boolean; reason?: string }> {
  const url = `https://${apexDomain}/.well-known/hack-latam-challenge.txt`;
  const res = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(12_000),
    headers: { accept: "text/plain,*/*" },
  });
  if (!res.ok) {
    return {
      ok: false,
      reason: `No se pudo leer el archivo (HTTP ${res.status}).`,
    };
  }
  const text = (await res.text()).trim();
  if (text.length > 4096) {
    return {
      ok: false,
      reason: "La respuesta del archivo es demasiado grande.",
    };
  }
  if (text === expectedToken) {
    return { ok: true };
  }
  return {
    ok: false,
    reason:
      "El contenido del archivo no coincide con el token. Debe contener solo el token, sin espacios extra.",
  };
}

const ZAVU_MESSAGES_URL = "https://api.zavu.dev/v1/messages";

function isNonEmptyEmail(value: string | undefined): value is string {
  return typeof value === "string" && value.includes("@") && value.trim().length > 0;
}

async function sendDomainVerifiedEmailViaZavu(params: {
  to: string;
  domain: string;
  idempotencyKey: string;
  apiKey: string;
}): Promise<{ ok: true; messageId?: string } | { ok: false; error: string }> {
  const subject = "Dominio verificado";
  const text =
    `Has verificado correctamente el dominio ${params.domain} en Hack Latam.\n\n` +
    `Fecha (UTC): ${new Date().toISOString()}\n\n` +
    `Si no iniciaste esta verificación, ignora este mensaje.`;

  try {
    const res = await fetch(ZAVU_MESSAGES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: params.to,
        channel: "email",
        subject,
        text,
        idempotencyKey: params.idempotencyKey,
      }),
      signal: AbortSignal.timeout(25_000),
    });

    let raw: unknown;
    try {
      raw = await res.json();
    } catch {
      raw = null;
    }

    if (!res.ok) {
      const apiMsg =
        typeof raw === "object" &&
        raw !== null &&
        "message" in raw &&
        typeof (raw as { message: unknown }).message === "string"
          ? (raw as { message: string }).message
          : null;
      const error =
        apiMsg && apiMsg.length > 0 ? apiMsg : `Zavu HTTP ${res.status}`;
      return { ok: false, error };
    }

    const messageId =
      typeof raw === "object" &&
      raw !== null &&
      "message" in raw &&
      typeof (raw as { message: unknown }).message === "object" &&
      (raw as { message: { id?: unknown } }).message !== null
        ? (raw as { message: { id?: string } }).message.id
        : undefined;

    return {
      ok: true,
      ...(typeof messageId === "string" && messageId.length > 0
        ? { messageId }
        : {}),
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export const verifyCheck = actionGeneric({
  args: { domain: v.string() },
  returns: v.object({
    ok: v.boolean(),
    appliedStatus: v.union(
      v.literal("verified"),
      v.literal("failed"),
      v.literal("skipped"),
    ),
    message: v.optional(v.string()),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{
    ok: boolean;
    appliedStatus: "verified" | "failed" | "skipped";
    message?: string;
  }> => {
    const { internal } = await import("./_generated/api.js");
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const row = await ctx.runQuery(internal.verifiedDomainsInternal.internalGetRow, {
      userId: identity.tokenIdentifier,
      domain: args.domain,
    });

    if (!row) {
      return {
        ok: false,
        appliedStatus: "skipped" as const,
        message: "No hay verificación pendiente para este dominio.",
      };
    }

    if (row.status === "verified") {
      return {
        ok: true,
        appliedStatus: "skipped" as const,
        message: "Este dominio ya está verificado.",
      };
    }

    if (row.status !== "pending") {
      return {
        ok: false,
        appliedStatus: "skipped" as const,
        message: row.status === "failed"
          ? "El último intento falló. Inicia de nuevo la verificación para obtener un token nuevo."
          : "Estado de verificación no válido.",
      };
    }

    let check: { ok: boolean; reason?: string };
    if (row.method === "dns_txt") {
      check = await verifyDnsTxt(`_hack-latam-verify.${row.domain}`, row.token);
    } else {
      check = await verifyHttpFile(row.domain, row.token);
    }

    if (check.ok) {
      await ctx.runMutation(internal.verifiedDomainsInternal.internalApplyVerification, {
        userId: identity.tokenIdentifier,
        domain: args.domain,
        status: "verified",
      });

      const attemptAt = Date.now();
      const apiKey = process.env.ZAVUDEV_API_KEY?.trim();
      const recipientEmail = identity.email;

      if (!isNonEmptyEmail(recipientEmail)) {
        await ctx.runMutation(
          internal.verifiedDomainsInternal.internalRecordVerificationEmailAttempt,
          {
            userId: identity.tokenIdentifier,
            domain: args.domain,
            lastAttemptAt: attemptAt,
            outcome: "skipped",
            errorMessage:
              "No hay correo en tu cuenta de sesión; no se envió notificación.",
          },
        );
      } else if (!apiKey) {
        await ctx.runMutation(
          internal.verifiedDomainsInternal.internalRecordVerificationEmailAttempt,
          {
            userId: identity.tokenIdentifier,
            domain: args.domain,
            lastAttemptAt: attemptAt,
            outcome: "skipped",
            errorMessage:
              "ZAVUDEV_API_KEY no está configurada en Convex; no se envió notificación.",
          },
        );
      } else {
        const idempotencyKey = `domain-verified:${identity.tokenIdentifier}:${args.domain}`;
        const sendResult = await sendDomainVerifiedEmailViaZavu({
          to: recipientEmail.trim(),
          domain: args.domain,
          idempotencyKey,
          apiKey,
        });

        if (sendResult.ok) {
          await ctx.runMutation(
            internal.verifiedDomainsInternal.internalRecordVerificationEmailAttempt,
            {
              userId: identity.tokenIdentifier,
              domain: args.domain,
              lastAttemptAt: attemptAt,
              outcome: "sent",
              messageId: sendResult.messageId,
            },
          );
        } else {
          await ctx.runMutation(
            internal.verifiedDomainsInternal.internalRecordVerificationEmailAttempt,
            {
              userId: identity.tokenIdentifier,
              domain: args.domain,
              lastAttemptAt: attemptAt,
              outcome: "failed",
              errorMessage: sendResult.error,
            },
          );
        }
      }

      return { ok: true, appliedStatus: "verified" as const };
    }

    await ctx.runMutation(internal.verifiedDomainsInternal.internalApplyVerification, {
      userId: identity.tokenIdentifier,
      domain: args.domain,
      status: "failed",
      failureReason: check.reason,
    });

    return {
      ok: false,
      appliedStatus: "failed" as const,
      message: check.reason,
    };
  },
});
