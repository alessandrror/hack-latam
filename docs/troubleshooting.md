# Troubleshooting

| Field | Value |
|-------|-------|
| **Status** | Live |
| **Owner** | Product / Engineering |
| **Last updated** | 2026-05-17 |
| **Linked from** | [Def/Acc product hub](defacc-alignment-and-scoring-plan.md) |

## Purpose

Capture **frequent failures** when running scans locally or calling the API, with **mitigations**.

## Goals

- **G1:** Shorten debug time for `400`s, module `error`, empty findings.
- **G2:** Distinguish **expected skips** (IP input, `quick` mode) from bugs.

## Non-goals

- Replacing hosting-provider or corporate firewall support.

## Known-issue snapshot

| Topic | Status |
|-------|--------|
| **crt.sh slow / 5xx** | **Upstream** — retries / alternate domain; see below |
| **No rate limit on `POST /api/scan`** | **Product gap** — track [product hub §10](defacc-alignment-and-scoring-plan.md#10-risks-and-mitigations) |

## UI: “Network error — try again.”

**Cause:** Browser could not complete `fetch("/api/scan")` (server down, DNS, CORS misconfiguration in non-local setups, etc.).

**Checks:**

- Dev server running: `pnpm dev`.
- Same origin: UI expects `/api/scan` on the same host as the page (default in local dev).

## API: `400` — `Invalid JSON body.`

**Cause:** `POST` body is not valid JSON.

**Fix:** Send `Content-Type: application/json` and a JSON object like `{"target":"example.com"}`.

## API: `400` — domain message

**Cause:** `classifyAndNormalizeTarget` returned `unknown` or empty — e.g. **company name only**, **IPv6**, malformed host, or garbage string.

**Fix:** Use `example.com` or `https://example.com` format, or a bare **IPv4** if testing skip behavior.

## Module `subdomain_enum` → `error`

Common messages (from [`src/lib/recon/subdomains.ts`](../src/lib/recon/subdomains.ts)):

| Symptom | Likely cause |
|---------|----------------|
| `crt.sh request failed: ...` | Timeout (25s), DNS, local network, firewall |
| `crt.sh returned HTTP 5xx` | Upstream crt.sh outage or overload |
| `crt.sh returned non-JSON` | Unexpected response body |
| `crt.sh JSON was not an array` | API shape change |

**Mitigation:** Retry later; try another domain to isolate crt.sh vs your network.

## Module hostname-based skips

**Expected** when `inputKind` is **`ip`**: **`subdomain_enum`**, **`dns_health`**, and **`tls_check`** all register **`skipped`**. Enter a **domain name** or URL to run them.

## Module `dns_health` → `error`

Rare for pure DNS lookups; **`ENOTFOUND`** / timeouts / resolver outages can surface.

**Mitigation:** Retry; verify server network/DNS egress; rule out typo in apex domain input.

## Module `tls_check` → `error`

Typical causes: **no HTTPS** on `:443`, **firewall**/cloud blocking outbound TLS from your dev machine, wrong hostname vs production cert only on `www`.

| Symptom | Likely cause |
|---------|----------------|
| `ECONNREFUSED` | Nothing listening on 443 |
| `TLS connection timed out` | 15s limit or network block |
| `certificate has expired` in stack | Unexpected — usually caught as handshake issue |

**Mitigation:** Confirm the domain serves TLS on **443** from general internet.

## Empty `findings`

- **`inputKind: "ip"`** — expected: all hostname modules are **`skipped`** and **`findings`** is **`[]`**; use a **domain**.
- **`inputKind: "domain"`** with all modules **`ok`** — expect **multiple findings normally** in **`deep`** (CT + email-auth + TLS + deep extras). In **`quick`**, **`low`** severities are **omitted** from the API payload — fewer rows are normal.

If **`ok`** domains return **`findings: []`**, inspect server logs — inconsistent with current modules.

## Development tips

- Watch terminal logs for server-side stack traces.
- Reproduce with `curl` (see [API reference](api-reference.md)).
- Inspect `modules[].errorMessage` in JSON responses.

## Related

- [API reference](api-reference.md)
- [Privacy & data sources](privacy-and-data-sources.md)
- [Def/Acc product hub](defacc-alignment-and-scoring-plan.md)
