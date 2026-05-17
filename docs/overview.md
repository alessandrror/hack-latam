# Overview

| Field | Value |
|-------|-------|
| **Status** | Live |
| **Owner** | Product / Engineering |
| **Last updated** | 2026-05-17 |
| **Linked from** | [Def/Acc product hub](defacc-alignment-and-scoring-plan.md) |

## Purpose and problem

**Hack LATAM — Attack Surface Dashboard** is a web app that helps **small businesses without a dedicated security team** understand what is already **publicly visible** about their internet-facing assets.

Users enter a **domain**, **URL**, or (in the API) a raw **IPv4** address. The backend runs **passive** reconnaissance steps and returns:

- **Findings** — severity, title, and a **plain-language** explanation (not raw jargon).
- **Module status** — which steps succeeded, failed, or were skipped (e.g. subdomain discovery cannot run on a bare IP).

## Goals

- **G1:** Give SMB operators a **single-screen** prioritized view of passive risks (email-auth, TLS, hostname footprint).
- **G2:** Support **def/acc** positioning — defensive, authorized use, no exploitation claims ([product hub](defacc-alignment-and-scoring-plan.md)).
- **G3:** Keep expectations honest — **incomplete** passive data; no “green = safe” implication.

## Non-goals

- Offensive reconnaissance, exploitation, or scanning arbitrary third parties without permission.
- Replacing professional assessments, compliance programs, or SOC/SIEM.
- Real-time intrusion detection.

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
- [User guide](user-guide.md), [Recon modules](recon-modules.md).
