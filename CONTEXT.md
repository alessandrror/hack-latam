# Attack Surface Dashboard — Project Context

## What is this?

A web app that helps small businesses (PYMEs) with no security team understand their external attack surface. The user inputs a domain, IP range, or company name and gets a passive reconnaissance report with findings in plain language.

Built for the **def/acc track** of a hackathon — the goal is to make people and institutions more resilient, not to build offensive tooling.

## Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **Language:** TypeScript

## Core Features

1. **Flexible input** — accepts a domain (`example.com`), IP / IP range, or company name
2. **Parallel recon modules** — each runs independently and streams results back
3. **Plain-language findings** — every result has a severity tag and a one-line explanation for non-technical users

## Recon Modules

| Module | What it does | Source |
|---|---|---|
| Subdomain enum | Discovers active subdomains | crt.sh API + DNS lookup |
| Port scan | Open ports on discovered IPs | Shodan API |
| SSL/TLS check | Expired or misconfigured certs | SSL Labs API |
| DNS health | SPF, DMARC, DKIM presence | Direct DNS queries |
| WHOIS / ASN | Registrant info, hosting provider | WHOIS API |
| Exposed services | RDP, FTP, Telnet exposed | Shodan API |
| Leaked credentials | Emails found in breaches | HaveIBeenPwned API |

## Severity System

- 🔴 **Critical** — immediate risk, exposed service or leaked credentials
- 🟡 **Medium** — misconfiguration that could be exploited
- 🟢 **Low** — missing best practice, low direct risk

## UI Structure

- **Top nav** — logo, domain input + scan button, scan status indicator
- **Scan progress bar** — full width, animates during active scan
- **Left column** — assets discovered (subdomains, IPs, open ports)
- **Center column** — risk summary + findings list
- **Right column** — SSL & DNS health checklist
- **Footer note** — "All scans are passive and non-intrusive."

## Design Tokens

- Background: `bg-gray-950`
- Accent: `text-green-400`, `border-green-500`
- Critical: `text-red-400`
- Data values: monospace font (JetBrains Mono or Fira Code)
- Tone: professional and minimal — built for non-hackers

## Important Constraints

- All scans must be **passive** (no exploitation, no active probing beyond standard recon)
- Findings must include a plain-language description — no raw technical jargon shown to the user
- The app must work as a demo with real API calls during the hackathon presentation
