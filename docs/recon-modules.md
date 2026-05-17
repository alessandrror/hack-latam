# Recon modules

This page separates **what the code runs today** from the **roadmap** in [CONTEXT.md](../CONTEXT.md) and [init.md](../init.md).

## Implemented today

| Module name (code) | Status | What it does | External source |
|--------------------|--------|--------------|-----------------|
| `subdomain_enum` | **Live** | Collects hostnames seen in public **certificate transparency** logs for `%.{domain}` | [crt.sh](https://crt.sh/) JSON API |

Implementation: [`src/lib/recon/subdomains.ts`](../src/lib/recon/subdomains.ts).

**Behavior notes:**

- **25s** fetch timeout (`AbortController`); failures surface as module `error` with a message.
- Hostnames are deduplicated, filtered, sorted; UI may show up to **200** with `totalHostnames` in metadata.
- Wildcard prefixes like `*.` are stripped for display grouping inputs; lines with spaces or `*` after processing are skipped.

**When it is skipped:**

- Input classifies as **`ip`** (IPv4) — certificate-transparency-based subdomain enum is not applicable. See [`src/app/api/scan/route.ts`](../src/app/api/scan/route.ts).

## Planned / roadmap (not implemented in this repo)

The following appear in project context as **intended** modules for a fuller “attack surface” demo. **They do not have corresponding implementations** under `src/lib/recon/` or extra API routes at the time of this documentation.

| Module (conceptual) | Intended capability | Typical source (from CONTEXT / init) |
|---------------------|--------------------|--------------------------------------|
| Port scan | Open ports on discovered IPs | Shodan API |
| SSL/TLS check | Cert expiry / misconfig signals | SSL Labs API |
| DNS health | SPF, DMARC, DKIM presence | Direct DNS |
| WHOIS / ASN | Registrant / hosting context | WHOIS API |
| Exposed services | RDP, FTP, Telnet, etc. | Shodan API |
| Leaked credentials | Breach visibility for emails | Have I Been Pwned API |

Adding these would require new server code, **API keys** (where applicable), rate-limit handling, and updated UX — plus clear “authorized use only” messaging. If secrets are introduced, add a **`.env.example`** and document it (none exists yet).

## Severity vs module

Severity is attached to **`ScanFinding`** objects, not to the module list. See [Severity system](severity-system.md).

## Related

- [Architecture](architecture.md)
- [Privacy & data sources](privacy-and-data-sources.md)
- [Threat model](threat-model.md)
