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
