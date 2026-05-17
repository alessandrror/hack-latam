import { classifyAndNormalizeTarget } from "@/lib/recon/normalize-target";
import { extractApexFromNormalizedHost } from "@/lib/recon/extract-apex";
import { api, convexAuthedClient } from "@/lib/convex-server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  const rawDomain =
    typeof body === "object" &&
    body !== null &&
    "domain" in body &&
    typeof (body as { domain: unknown }).domain === "string"
      ? (body as { domain: string }).domain
      : "";

  const rawMethod =
    typeof body === "object" &&
    body !== null &&
    "method" in body &&
    typeof (body as { method: unknown }).method === "string"
      ? (body as { method: string }).method.trim().toLowerCase()
      : "";

  const method = rawMethod === "http_file" ? "http_file" : "dns_txt";

  const { kind, normalized } = classifyAndNormalizeTarget(rawDomain);
  if (kind !== "domain" || !normalized) {
    return NextResponse.json(
      { error: "Indica un dominio válido para verificar." },
      { status: 400 },
    );
  }

  const apex = extractApexFromNormalizedHost(normalized);
  if (!apex) {
    return NextResponse.json(
      { error: "No se pudo determinar el dominio raíz (apex) para verificar." },
      { status: 400 },
    );
  }

  try {
    const client = await convexAuthedClient();
    const result = await client.mutation(api.verifiedDomains.initiate, {
      domain: apex,
      method,
    });

    if (result.outcome === "already_verified") {
      const dnsHost = `_hack-latam-verify.${apex}`;
      const httpUrl = `https://${apex}/.well-known/hack-latam-challenge.txt`;
      return NextResponse.json({
        apex,
        alreadyVerified: true,
        verifiedAt: result.verifiedAt,
        instructions: {
          dnsHostname: dnsHost,
          httpUrl,
        },
      });
    }

    const dnsHost = `_hack-latam-verify.${apex}`;
    const httpUrl = `https://${apex}/.well-known/hack-latam-challenge.txt`;

    return NextResponse.json({
      apex,
      alreadyVerified: false,
      token: result.token,
      method: result.method,
      instructions: {
        dnsHostname: dnsHost,
        dnsRecordValue: result.token,
        httpUrl,
        httpBodyMustBe: result.token,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "Unauthorized" || msg.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Inicia sesión para verificar un dominio." },
        { status: 401 },
      );
    }
    if (msg.includes("NEXT_PUBLIC_CONVEX_URL")) {
      return NextResponse.json(
        { error: "Convex no está configurado en el servidor." },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "No se pudo iniciar la verificación." },
      { status: 500 },
    );
  }
}
