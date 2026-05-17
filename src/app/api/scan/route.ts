import { classifyAndNormalizeTarget } from "@/lib/recon/normalize-target";
import { runScanModules } from "@/lib/recon/run-scan";
import type { ScanResponseBody } from "@/types/scan";
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

  const { modules, findings } = await runScanModules({
    normalizedTarget: normalized,
    inputKind: kind,
  });

  const payload: ScanResponseBody = {
    target,
    normalizedTarget: normalized,
    inputKind: kind,
    findings,
    modules,
  };

  return NextResponse.json(payload);
}
