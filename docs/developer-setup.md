# Developer setup

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
    run-scan.ts        # Registers modules + Promise.all orchestration
  types/scan.ts        # ScanFinding, ScanModuleResult, ScanResponseBody
```

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
