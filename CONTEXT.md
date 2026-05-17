# Attack Surface Dashboard — Project Context

## What is this?

A web app that helps small businesses (PYMEs) with no security team understand their **external attack surface** from publicly visible signals. Users enter **a domain or URL** (and the API accepts a bare **IPv4** for partial checks). The backend runs **passive** recon and returns findings in plain language.

Built for the **def/acc track** of a hackathon — the goal is to make people and institutions more resilient, not to build offensive tooling.

## Phase 1 (what we ship today)

1. **Input** — **Domain or URL**, or **`IPv4` in the API**. Free-text **company names** remain **unsupported** (`400` via normalization); resolving names to domains is **roadmap**.
2. **Parallel recon modules** — multiple modules run **in parallel** per scan; failures are **isolated per module** (others still return results).
3. **Single HTTP response** — one `POST /api/scan` returns all module statuses and findings. **Streaming** partial results is **roadmap**.
4. **Passive checks** — public certificate transparency (`crt.sh`), **DNS lookups** for email-auth signals (SPF, DMARC, DKIM hints), and a **client TLS handshake on port 443** to read the presented certificate (**not** full SSL Labs–style grading).

See [docs/recon-modules.md](docs/recon-modules.md) for the exact module list vs roadmap.

## Roadmap (broader vision)

| Direction | Notes |
|-----------|------|
| **Richer input** | IP ranges, **company-name → domain** resolution |
| **More modules** | Shodan, SSL Labs, WHOIS/HIBP, etc. |
| **Progressive UX** | Live progress bar, streaming/SSE/polling |

## Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **Language:** TypeScript

## Recon Modules (conceptual backlog)

Beyond today’s implementations, longer-term targets include ports/exposed services (**Shodan**), richer TLS analysis (**SSL Labs**), WHOIS/ASN, and breach lookups — see [docs/recon-modules.md](docs/recon-modules.md).

## Severity System

- **Critical** — immediate risk (e.g. expired certificate on the inspected host, leaked credentials once that module exists)
- **Medium** — misconfiguration or gap that materially increases abuse risk
- **Low** — informational, best practice, or positive signal when present

## UI Structure

**Implemented today:** a single-column flow — form → **Modules** list → **Findings** list with badges and optional detail blocks.

**Vision (later):** top nav + progress bar + three-column layout (assets / risk / SSL & DNS checklist) as described historically in product sketches.

### Design Tokens (target aesthetic)

- Background: `bg-gray-950`
- Accent: `text-green-400`, `border-green-500`
- Critical: `text-red-400`
- Data values: monospace font (JetBrains Mono or Fira Code)
- Tone: professional and minimal — built for non-hackers

## Important Constraints

- All scans must be **passive** (no exploitation, no disruptive scanning beyond standard recon)
- Findings include a plain-language explanation — minimize raw jargon in the UI
- The demo should support **live** outbound calls where possible (crt.sh + DNS + target HTTPS today)
