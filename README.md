# Hack LATAM — Passive SMB attack-surface dashboard

Small web app for **PYMEs / SMBs without a security team**: enter a domain you are allowed to assess and receive a **passive, plain-language** snapshot of public signals (not a pen test or “real-time threat” feed). Built for a **def/acc** hackathon track — **defensive resilience**, not offensive tooling.

## Quick start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Other package managers:

```bash
npm install && npm run dev
# or
yarn install && yarn dev
```

## Run a scan

1. Enter **`example.com`** or **`https://www.example.com`** (URLs are normalized to a hostname).
2. Click **Start scan**.
3. Review **Modules** (status per recon step) and **Findings** (severity + short explanation).

**Example targets:** `cloudflare.com`, `github.com`, or your own domain.

**Note:** Raw **IPv4** addresses are accepted as input, but **subdomain discovery via certificate transparency requires a domain** — for IPs, `subdomain_enum` is marked **skipped** with an explanatory message.

## What you’ll see

- **Normalized target** — how the server interpreted your input (`domain` vs `ip`).
- **Modules** — each recon module reports `ok`, `error`, or `skipped`, plus timing when relevant.
- **Findings** — `critical` / `medium` / `low` badges, a title, a plain-language explanation, and optional metadata (e.g. a list of hostnames from public cert logs).

## Passive & non-intrusive

Scans use **public data, DNS lookups, and a normal HTTPS handshake on port 443** to surface certificate transparency (**[crt.sh](https://crt.sh/)**), SPF/DMARC/DKIM hints (`dns_health`), and leaf TLS metadata (`tls_check`). **No exploitation**, credential stuffing, or disruptive scanning intent. See [docs/threat-model.md](docs/threat-model.md) and [docs/privacy-and-data-sources.md](docs/privacy-and-data-sources.md).

## Limitations today

- **Implemented modules:** see [docs/recon-modules.md](docs/recon-modules.md) and [`src/lib/recon/run-scan.ts`](src/lib/recon/run-scan.ts) (certificate transparency footprints, SPF/DMARC/DKIM hints, TLS on port **443**, deep-mode extras such as legacy TLS probes, SPF/DMARC policy detail, CAA).
- **Roadmap** (CONTEXT / init / recon-modules): richer inputs (company-name resolution, IP ranges), Shodan, SSL Labs–style grading, WHOIS/HIBP, streaming UI — not all wired here yet.
- **Streaming** UI / partial SSE updates are **not** implemented — one JSON response per `POST /api/scan`.
- Optional **AI insights** use OpenRouter; copy `.env.example` to `.env.local` for `OPENROUTER_API_KEY` if you enable that route.

## Documentation

| Doc | Audience |
|-----|----------|
| [Overview](docs/overview.md) | Everyone |
| [User guide](docs/user-guide.md) | End users / judges |
| [API reference](docs/api-reference.md) | Integrators |
| [Architecture](docs/architecture.md) | Developers |
| [Recon modules](docs/recon-modules.md) | What runs today vs roadmap |
| [Severity system](docs/severity-system.md) | Reading results |
| [Threat model](docs/threat-model.md) | Security & abuse posture |
| [Privacy & data sources](docs/privacy-and-data-sources.md) | Data sent externally |
| [Troubleshooting](docs/troubleshooting.md) | When scans fail |
| [Developer setup](docs/developer-setup.md) | Extending the app |
| [Def/Acc alignment & scoring roadmap](docs/defacc-alignment-and-scoring-plan.md) | Track fit, demos, prioritized improvements |

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Development server |
| `pnpm build` | Production build |
| `pnpm start` | Run production server |
| `pnpm lint` | ESLint |

## Stack

- **Next.js** (App Router) — [Next.js docs](https://nextjs.org/docs)
- **React** + **TypeScript**
- **Tailwind CSS** v4
