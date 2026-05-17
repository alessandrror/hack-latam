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

  const { kind, normalized } = classifyAndNormalizeTarget(rawDomain);
  if (kind !== "domain" || !normalized) {
    return NextResponse.json(
      { error: "Indica un dominio válido." },
      { status: 400 },
    );
  }

  const apex = extractApexFromNormalizedHost(normalized);
  if (!apex) {
    return NextResponse.json(
      { error: "No se pudo determinar el apex del dominio." },
      { status: 400 },
    );
  }

  try {
    const client = await convexAuthedClient();
    const result = await client.action(api.verifiedDomainsActions.verifyCheck, {
      domain: apex,
    });
    return NextResponse.json({ apex, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "Unauthorized" || msg.includes("Unauthorized")) {
      return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
    }
    if (msg.includes("NEXT_PUBLIC_CONVEX_URL")) {
      return NextResponse.json(
        { error: "Convex no está configurado en el servidor." },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: msg || "Error al comprobar la verificación." },
      { status: 500 },
    );
  }
}
