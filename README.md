# Hack LATAM — Attack Surface Dashboard

A small web app for **PYMEs / SMBs without a security team**: enter a domain or URL and get a **passive** recon report in plain language. Built for a hackathon **defense / acceleration** track — resilience, not offensive tooling.

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

Scans use **public data and standard queries** (today: certificate transparency via [crt.sh](https://crt.sh/)). There is **no exploitation**, no credential stuffing, and no intent to disrupt targets. See [docs/threat-model.md](docs/threat-model.md) and [docs/privacy-and-data-sources.md](docs/privacy-and-data-sources.md).

## Limitations today

- **Implemented:** subdomain / hostname discovery from **crt.sh** only (`subdomain_enum`).
- **Planned** (see [CONTEXT.md](CONTEXT.md), [init.md](init.md), [docs/recon-modules.md](docs/recon-modules.md)): port / exposed-service signals (e.g. Shodan), SSL/TLS review, DNS email-auth checks, WHOIS/ASN, breach lookups — **not wired in this repo yet**.
- Streaming UI updates are **not** implemented; the UI waits for one `POST /api/scan` response.
- No `.env.example` yet — current integration uses a **public** API only.

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
