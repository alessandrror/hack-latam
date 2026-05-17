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
    api/scan/route.ts  # POST /api/scan
  lib/recon/
    normalize-target.ts
    subdomains.ts
  types/scan.ts        # ScanFinding, ScanModuleResult, ScanResponseBody
```

## Lint & build

```bash
pnpm lint
pnpm build
pnpm start   # after build — production mode
```

## Extending recon modules

1. Add a function under `src/lib/recon/` that returns `Promise<ScanFinding[]>` (or throws on hard failure).
2. In [`src/app/api/scan/route.ts`](../src/app/api/scan/route.ts), invoke it when input kind and dependencies match (e.g. only after you have IPs).
3. Push a `ScanModuleResult` with `name`, `status`, `durationMs`, and `errorMessage` as today.
4. Document the module in [Recon modules](recon-modules.md) and any new env vars in a future `.env.example`.

**Async / parallel:** `Promise.all` is fine for independent steps; handle partial failure so one API outage does not wipe all results.

**Streaming:** not implemented; would need a different response strategy than single JSON (SSE, NDJSON, polling).

## Next.js note

This repo uses **Next.js 16** with the App Router. If APIs differ from older docs, prefer `node_modules/next/dist/docs/` per [AGENTS.md](../AGENTS.md).

## Related

- [Architecture](architecture.md)
- [API reference](api-reference.md)
