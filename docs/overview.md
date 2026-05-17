# Overview

## What this is

**Hack LATAM — Attack Surface Dashboard** is a web app that helps **small businesses without a dedicated security team** understand what is already **publicly visible** about their internet-facing assets.

Users enter a **domain**, **URL**, or (in the API) a raw **IPv4** address. The backend runs **passive** reconnaissance steps and returns:

- **Findings** — severity, title, and a **plain-language** explanation (not raw jargon).
- **Module status** — which steps succeeded, failed, or were skipped (e.g. subdomain discovery cannot run on a bare IP).

See also: [User guide](user-guide.md), [Recon modules](recon-modules.md).

## Who it is for

- **SMB owners / operators** who need “what should I worry about?” in one screen.
- **Hackathon judges** evaluating clarity, def/acc alignment, and responsible scope.

## What a scan returns (conceptually)

1. **Normalized target** — how the server interpreted input (hostname vs IP).
2. **Modules** — execution summary for each recon unit (`ok` | `error` | `skipped`).
3. **Findings** — business-friendly risk items; optional metadata such as hostname lists.

## Scope disclaimer

This tool surfaces **public or passively observable** information (**certificate transparency, DNS lookups, and a TLS read on HTTPS port 443**). It does **not** prove completeness (“no finding” ≠ “perfectly secure”), and it does **not** replace a full assessment or pen test.

## Related docs

- [Architecture](architecture.md) — request flow.
- [API reference](api-reference.md) — `POST /api/scan`.
- [Threat model](threat-model.md) — abuse and intent boundaries.
