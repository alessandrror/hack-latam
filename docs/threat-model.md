# Threat model

| Field | Value |
|-------|-------|
| **Status** | Live |
| **Owner** | Product / Engineering |
| **Last updated** | 2026-05-17 |
| **Linked from** | [Def/Acc product hub](defacc-alignment-and-scoring-plan.md) |

## Purpose

Provide **authorized** users (typically **asset owners** or **trainers**) a **passive** view of information already discoverable about a domain — framed for **SMB resilience** (hackathon **def/acc** track), not for unauthorized reconnaissance.

## Goals

- **G1 — Reduce misuse narrative:** position the app as **authorized-target** defensive tooling; complement with rate limits and (roadmap) ownership verification ([product hub §6](defacc-alignment-and-scoring-plan.md#6-feature-status-matrix)).
- **G2 — Reduce misinterpretation:** passive snapshots are **incomplete**; link operators to [User guide](user-guide.md).
- **G3 — Maintain proportionate mitigations** for a demo/MVP (document abuse paths; server-side enforcement for deep scans — see [prd-domain-ownership-verification.md](prd-domain-ownership-verification.md)).

## Non-goals

- Guaranteeing that all abuse is impossible (determined actors bypass the product).
- Legal/TOS automation beyond documenting expectations.

## Trust boundaries

```mermaid
flowchart LR
  subgraph trustUser [Trusted operator]
    browser[Browser]
  end
  subgraph trustApp [This application]
    nextApp[Next.js server]
  end
  subgraph trustPublic [Public internet]
    crtSh[crt.sh]
    resolver[DNS resolver]
    targetHttps[Target host port443]
  end

  browser -->|HTTPS localhost in dev| nextApp
  nextApp -->|HTTPS GET JSON| crtSh
  nextApp -->|DNS lookups| resolver
  nextApp -->|TLS handshake| targetHttps
```

- **User → app:** form input and HTTP API to `POST /api/scan`. Treat logs and screenshots as potentially sensitive if they contain customer domains.
- **App → crt.sh:** server-side `fetch`; query embeds the **normalized domain** (see [Privacy & data sources](privacy-and-data-sources.md)).
- **App → DNS:** Node `dns` resolution (resolver path depends on server OS / hosting).
- **App → target:** outbound **TLS on port 443** to read the leaf certificate (**no exploitation** intent).

## Assets we protect

- **Operator reputation** — misuse could harm the project or users.
- **Subject privacy** — domains and derived hostnames are **business identifiers**.
- **Availability** — reliance on free public APIs (crt.sh) and outbound connectivity means scans can fail or slow down; not a security property but an operational one.

## Threats and mitigations (proportionate for a demo)

| Threat | Mitigation / stance |
|--------|---------------------|
| **Abuse as a bulk scanning / harassment tool** | Document “authorized targets only”; do not market for attacking third parties; consider rate limits / auth in production; roadmap **ownership verification** for deep scans. |
| **Misinterpretation (“green = safe”)** | Plain-language caveats: passive data is **incomplete**; see [User guide](user-guide.md). |
| **Supply chain / API tampering** | Use HTTPS to crt.sh; validate HTTP status and JSON shape; surface errors to UI instead of failing silently. |
| **Injection via user “target” field** | Input is normalized to domain/IP; still treat external API/TLS/cert data as **untrusted** (parse defensively). |

## What we explicitly do **not** claim

- No exploitation, no credential stuffing, no volumetric probing of arbitrary hosts beyond **normal** DNS lookups, **one** crt.sh query per domain scan, and a **single** outbound TLS handshake to **443** for certificate inspection ([Recon modules](recon-modules.md)).
- Not a replacement for professional security assessment or compliance.

## “Non-intrusive” statement

The UI stresses passive scans: **certificate transparency**, **DNS email-auth lookups**, and a **single TLS handshake** to read HTTPS certificate metadata — no authentication bypass, no payload delivery, no multi-port pounding from this codebase.

## Related

- [Privacy & data sources](privacy-and-data-sources.md)
- [Overview](overview.md)
- [Def/Acc product hub](defacc-alignment-and-scoring-plan.md)
