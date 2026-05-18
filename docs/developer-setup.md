# Developer setup

| Field | Value |
|-------|-------|
| **Status** | Live |
| **Owner** | Product / Engineering |
| **Last updated** | 2026-05-17 |
| **Linked from** | [Def/Acc product hub](defacc-alignment-and-scoring-plan.md) |

## Purpose

Get a **local dev environment** running and show where to add recon modules safely.

## Goals

- **G1:** Reproducible `pnpm dev` flow.
- **G2:** Point extenders at **`run-scan.ts`** + [Recon modules](recon-modules.md).

## Non-goals

- **Prerequisites** are **not** a substitute for reading [Next.js](https://nextjs.org) docs when APIs differ — see [AGENTS.md](../AGENTS.md).

## Prerequisites

- **Node.js** (see Next.js 16 engine expectations)
- **pnpm** (recommended; lockfile may exist in repo) or npm/yarn

## Install & run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project layout (high-signal)

```
src/
  app/
    page.tsx           # Scan form + results UI
    layout.tsx         # Root layout, fonts, metadata
    globals.css        # Tailwind v4 import + theme
    api/scan/route.ts  # POST /api/scan — parses target, invokes runScanModules
  lib/recon/
    scan-context.ts    # ScanModuleContext type
    normalize-target.ts
    subdomains.ts      # subdomain_enum
    dns-health.ts      # dns_health
    tls-check.ts       # tls_check
    tls-versions-check.ts   # tls_versions_check (deep)
    dns-auth-details.ts       # dns_auth_details (deep)
    dns-caa-check.ts         # dns_caa_check (deep)
    run-scan.ts        # Registers modules + Promise.all orchestration
  types/scan.ts        # ScanFinding, ScanModuleResult, ScanResponseBody
```

## Convex (opcional pero recomendado)

1. Crea un deployment en [Convex](https://dashboard.convex.dev) y define `NEXT_PUBLIC_CONVEX_URL` en `.env.local`.
2. Configura **Clerk → JWT template “convex”** y `CLERK_JWT_ISSUER_DOMAIN` / variables de Convex según [convex/auth.config.ts](../convex/auth.config.ts).
3. Sincroniza secretos compartidos en el dashboard de Convex:
   - `INSIGHTS_CACHE_WRITE_SECRET` (escrituras de caché de IA desde Next).
   - Opcional — **solo desarrollo / entorno local**: `DEV_DATA_RESET_SECRET` para la mutación `dev:clearAllTablesForDev` (borra tablas `scans` y `aiInsightsCache`).

### Borrar datos en desarrollo (local)

Con `npx convex dev` o `npx convex deploy` según tu flujo:

```bash
npx convex run dev:clearAllTablesForDev '{"secret":"<DEV_DATA_RESET_SECRET>"}'
```

Úsalo **solo en dev** cuando cambies el esquema y quieras empezar limpio. No compartas el secreto ni lo reutilices en producción sin proceso operacional claro.

## Lint & build

```bash
pnpm lint
pnpm build
pnpm start   # after build — production mode
```

## Extending recon modules

1. Add `src/lib/recon/my-module.ts` exporting an async runner that resolves to `ScanFinding[]` (or throws for hard failures you want surfaced as module `error`).
2. Register the module in [`src/lib/recon/run-scan.ts`](../src/lib/recon/run-scan.ts): `name`, `skipReason` (or `null` when applicable), `run`.
3. If the UI benefits from structured extras, stash them under `finding.metadata` and extend [`src/app/page.tsx`](../src/app/page.tsx) (`FindingMetadataBlocks`) sparingly.
4. Document behaviors in [Recon modules](recon-modules.md) and add `.env.example` when secrets are introduced.

**Parallelism:** the runner executes modules concurrently; isolate failures inside each module runner.

**Streaming:** not implemented — still a single JSON response — would need SSE, NDJSON, or polling beyond `POST /api/scan`.

## Next.js note

This repo uses **Next.js 16** with the App Router. If APIs differ from older docs, prefer `node_modules/next/dist/docs/` per [AGENTS.md](../AGENTS.md).

## Related

- [Architecture](architecture.md)
- [API reference](api-reference.md)
- [Def/Acc product hub](defacc-alignment-and-scoring-plan.md)
