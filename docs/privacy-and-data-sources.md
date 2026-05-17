# Privacy & data sources

| Field | Value |
|-------|-------|
| **Status** | Live |
| **Owner** | Product / Engineering |
| **Last updated** | 2026-05-17 |
| **Linked from** | [Def/Acc product hub](defacc-alignment-and-scoring-plan.md) |

## Purpose

Document **egress destinations**, **data minimization** stance, and **operator responsibilities** for passive scans.

## Goals

- **G1:** Transparency on what the server sends to **crt.sh**, **DNS**, and **target :443**.
- **G2:** Minimize retention — clarify **session/no DB** default vs **Convex** when persistence is wired ([product hub](defacc-alignment-and-scoring-plan.md)).

## Non-goals

- Legal privacy policy text (add separately if needed for production).

## What leaves this app today

| Destination | When | What is sent |
|-------------|------|--------------|
| **crt.sh** | `inputKind === "domain"` and `subdomain_enum` runs | HTTPS GET `https://crt.sh/?q={encodeURIComponent("%.domain")}&output=json` |
| **DNS resolver** | `dns_health` runs for **domains** | TXT (and transitive resolver behavior) lookups for apex, `_dmarc.{domain}`, `{selector}._domainkey.{domain}` — powered by Node `dns` / host resolver config |
| **Target hostname :443** | `tls_check` runs for **domains** | Outbound TLS client handshake to **`{normalized domain}:443`** (SNI = same hostname); certificate bytes processed server-side |
| **Each OSINT hostname (HTTPS)** | `osint_passive` runs with at least **one hostname** (`primary domain` and/or domains derived from pasted `emails` under the **same apex**) | Outbound **`https://{host}/.well-known/security.txt`** (GET) and **`https://{host}/`** (HEAD, then GET fallback) |
| **OSINT resolver lookups** | `osint_passive` | `_mta-sts.{host}`, `_smtp._tls.{host}`, `default._bimi.{host}`, plus **DNSKEY** at the apex behind each host |
| **Convex `emailDomainSummaries`** table | Signed-in **`POST /api/scan`** with non-empty **`emails`** body | Persisted **counts + domain RHS strings only** (no mailbox locals) for audit/debug |

The **User-Agent** for crt.sh is set in [`src/lib/recon/subdomains.ts`](../src/lib/recon/subdomains.ts); OSINT HTTPS calls set a UA in [`src/lib/recon/osint-passive.ts`](../src/lib/recon/osint-passive.ts). Replace `+https://github.com/` with your real **repository or contact** URL when you publish.

**IPv4-only input:** crt.sh is **not** called; subdomain/DNS/TLS hostname modules register **skipped** (see [`src/lib/recon/run-scan.ts`](../src/lib/recon/run-scan.ts)). OSINT HTTPS requests require **explicit hostnames** — when the primary target is IPv4-only, **`osint_passive`** skips unless pasted emails yield same-apex hostnames eligible for probing.

## What crt.sh returns

Public JSON listing certificate log entries (`name_value`, `common_name`, etc.). The app parses hostnames and **does not** forward raw CT rows wholesale — only derived **hostname strings**, counts, and findings metadata.

## What DNS / TLS return

Resolver answers and certificate fields are distilled into **`ScanFinding` metadata** (presence flags, summaries, issuer, validity window). Operators should assume scan targets may appear in resolver logs/TLS firewall logs wherever the Next.js server runs.

## Data retained

- **Default scan path:** results exist in memory for the HTTP response and in the browser until refresh.
- **Convex:** `scans`, `verifiedDomains`, `aiInsightsCache`, and **`emailDomainSummaries`** (optional email-domain audit rows) persist when configured; Convex OAuth wiring may still omit some UI surfaces — see [product hub §6–§7](defacc-alignment-and-scoring-plan.md).
- Server logs (Next.js / hosting) may still record requests — configure appropriately for demos.

## Recommended practices (operators)

1. **Scan only assets you own or have permission to assess.**
2. **Hackathon demos:** prefer domains you control or public examples agreed with organizers.
3. **Do not paste secrets** into the target field (not useful, could leak in logs).
4. If you add APIs requiring keys (Shodan, HIBP, …), store them in env vars and add **`.env.example`** — not required for the integrations above.

## Limitations & third-party dependency

- **crt.sh** is a free community service — can be slow or error-prone; users see module `error` with a message.
- **Completeness:** CT does not list every hostname; DNS/DKIM checks use heuristics; TLS reads **443** only.

## Related

- [Threat model](threat-model.md)
- [Recon modules](recon-modules.md)
- [Troubleshooting](troubleshooting.md)
- [Def/Acc product hub](defacc-alignment-and-scoring-plan.md)
