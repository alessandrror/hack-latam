# Threat model

## Purpose of this app

Provide **authorized** users (typically **asset owners** or **trainers**) a **passive** view of information already discoverable about a domain — framed for **SMB resilience** (hackathon **def/acc** track), not for unauthorized reconnaissance.

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
  end

  browser -->|HTTPS localhost in dev| nextApp
  nextApp -->|HTTPS GET JSON| crtSh
```

- **User → app:** form input and HTTP API to `POST /api/scan`. Treat logs and screenshots as potentially sensitive if they contain customer domains.
- **App → crt.sh:** server-side `fetch`; query embeds the **normalized domain** (see [Privacy & data sources](privacy-and-data-sources.md)).

## Assets we protect

- **Operator reputation** — misuse could harm the project or users.
- **Subject privacy** — domains and derived hostnames are **business identifiers**.
- **Availability** — reliance on free public APIs (crt.sh) means scans can fail or slow down; not a security property but an operational one.

## Threats and mitigations (proportionate for a demo)

| Threat | Mitigation / stance |
|--------|---------------------|
| **Abuse as a bulk scanning / harassment tool** | Document “authorized targets only”; do not market for attacking third parties; consider rate limits / auth in production. |
| **Misinterpretation (“green = safe”)** | Plain-language caveats: passive data is **incomplete**; see [User guide](user-guide.md). |
| **Supply chain / API tampering** | Use HTTPS to crt.sh; validate HTTP status and JSON shape; surface errors to UI instead of failing silently. |
| **Injection via user “target” field** | Input is classified as domain/IP/string; used in URL encoding for crt.sh query — still treat external API responses as untrusted (parse defensively). |

## What we explicitly do **not** claim

- No exploitation, no credential stuffing, no port “hammering” of arbitrary hosts beyond what a future module might define (see [Recon modules](recon-modules.md): **only passive crt.sh today**).
- Not a replacement for professional security assessment or compliance.

## “Non-intrusive” statement

The UI copy states scans are passive. Today that means **reading public certificate transparency** for a domain string — no authentication bypass, no payload delivery, no aggressive scanning of the target’s infrastructure from this codebase.

## Related

- [Privacy & data sources](privacy-and-data-sources.md)
- [Overview](overview.md)
