# Recon modules

This page separates **what the code runs today** from the **roadmap** in [CONTEXT.md](../CONTEXT.md) and [init.md](../init.md).

Orchestration: modules are registered and run **in parallel** from [`src/lib/recon/run-scan.ts`](../src/lib/recon/run-scan.ts) (individual failures surface as module `error`).

## Implemented today

| Module name (code) | Status | What it does | Source |
|--------------------|--------|--------------|--------|
| `subdomain_enum` | **Live** | Hostnames seen in public **certificate transparency** for `%.{domain}` | [crt.sh](https://crt.sh/) JSON API |
| `dns_health` | **Live** | Passive checks for **SPF** (root-domain TXT `v=spf1`), **DMARC** TXT at `_dmarc.{domain}`, and **DKIM** hints via a **short list** of common selectors `{selector}._domainkey.{domain}` | Resolver: Node `dns` (typically system recursive resolver / OS configuration) |
| `tls_check` | **Live** | **TLS client** to **`{domain}:443`**, reads leaf certificate (**expiry**, issuer, SAN/CN hostname match vs requested name); `rejectUnauthorized: false` only to allow reading the certificate, then surfaces chain issues from `authorizationError` | Outbound TLS to **the target hostname** |
| `tls_versions_check` | **Deep only** | **Sequential** isolated TLS handshakes (TLS 1.0–1.3) on port **443** to see which protocol versions the server negotiates; flags legacy TLS 1.0/1.1 | Outbound TLS to the same host |
| `dns_auth_details` | **Deep only** | Parses **SPF** terminal policy (`-all` / `~all` / …) and **DMARC** `p=` / `pct=` when records exist | Node `dns` TXT (apex + `_dmarc`) |
| `dns_caa_check` | **Deep only** | **CAA** records at the zone apex | Node `dns.resolveCaa` |

**Implementation files:**

- `subdomain_enum`: [`src/lib/recon/subdomains.ts`](../src/lib/recon/subdomains.ts)
- `dns_health`: [`src/lib/recon/dns-health.ts`](../src/lib/recon/dns-health.ts)
- `tls_check`: [`src/lib/recon/tls-check.ts`](../src/lib/recon/tls-check.ts)
- `tls_versions_check`: [`src/lib/recon/tls-versions-check.ts`](../src/lib/recon/tls-versions-check.ts)
- `dns_auth_details`: [`src/lib/recon/dns-auth-details.ts`](../src/lib/recon/dns-auth-details.ts)
- `dns_caa_check`: [`src/lib/recon/dns-caa-check.ts`](../src/lib/recon/dns-caa-check.ts)

**`subdomain_enum` notes:**

- **25s** fetch timeout (`AbortController`); failures surface as module `error` with a message.
- Hostnames are deduplicated, filtered, sorted; UI may show up to **200** with `totalHostnames` in metadata.
- Wildcard prefixes like `*.` are stripped; lines with spaces or `*` after processing are skipped.

**`dns_health` notes:**

- Missing SPF or DMARC is reported as **`medium`** severity (phishing/abuse facilitator); DKIM hints are **`low`** (detection limited to common selectors).

**`tls_check` notes:**

- **~15s** connect timeout.
- Uses **HTTPS port 443** only; failures (no listener, handshake error) → module **`error`** with message.
- **`critical`** when the leaf appears **already expired**.

**When modules are skipped (IPv4 input):**

Domain-only modules expect a **hostname** (`inputKind === "domain"`). For **`inputKind === "ip"`**, they register `skipped` with an explanatory `errorMessage` — no crt.sh query, minimal DNS applicability, no SNI-oriented TLS check against a name.

**When modules are skipped (quick scan):**

**Deep-only** modules (`tls_versions_check`, `dns_auth_details`, `dns_caa_check`) register `skipped` when `mode === "quick"` (see [`run-scan.ts`](../src/lib/recon/run-scan.ts)).

## Planned / roadmap (not implemented yet)

Conceptual additions for a fuller “attack surface” demo (from CONTEXT / init):

| Module (conceptual) | Intended capability | Typical source |
|---------------------|---------------------|----------------|
| Port scan | Open ports on IPs | Shodan API |
| SSL/TLS (external grade) | Formal letter-grade / simulators | SSL Labs API |
| WHOIS / ASN | Registrant / hosting context | WHOIS API |
| Exposed services | RDP, FTP, Telnet, etc. | Shodan API |
| Leaked credentials | Breach visibility for emails | Have I Been Pwned API |

Adding these typically needs **API keys**, rate-limit handling, and UX updates — plus “authorized targets only” messaging. Introduce secrets via `.env.example` when applicable (none yet).

## Severity vs module

Severity is attached to **`ScanFinding`** objects, not to the module list. See [Severity system](severity-system.md).

## Related

- [Architecture](architecture.md)
- [Privacy & data sources](privacy-and-data-sources.md)
- [Threat model](threat-model.md)
