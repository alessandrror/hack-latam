# Severity system

Severities are defined in TypeScript as:

```ts
type Severity = "critical" | "medium" | "low";
```

Every **`ScanFinding`** must include one of these values. The UI renders colored badges for each.

## Design intent (product)

From [CONTEXT.md](../CONTEXT.md):

- **Critical** — immediate risk (e.g. expired HTTPS certificate as presented on port **443**, clear breach/exposure signals once added).
- **Medium** — misconfiguration or gap that increases abuse/spoofing risk or needs prompt attention before expiry warnings.
- **Low** — informational, positive (“record present”), footprint-only signals, or high-uncertainty checks.

## Module rules (today)

### `subdomain_enum` (crt.sh)

Source: [`src/lib/recon/subdomains.ts`](../src/lib/recon/subdomains.ts) — `severityForSubdomainCount`:

| Hostname count (after dedupe) | Severity |
|-------------------------------|----------|
| **0** | `low` |
| **1–50** | `low` |
| **> 50** | `medium` |

### `dns_health`

Source: [`src/lib/recon/dns-health.ts`](../src/lib/recon/dns-health.ts):

| Finding | Severity |
|---------|----------|
| SPF **present** | `low` |
| SPF **missing** | `medium` |
| DMARC **present** | `low` |
| DMARC **missing** | `medium` |
| DKIM (common selectors only) — **detected / not detected** | `low` (not detected is informational; provider may use other selectors) |

### `tls_check`

Source: [`src/lib/recon/tls-check.ts`](../src/lib/recon/tls-check.ts):

| Condition | Typical severity |
|-----------|------------------|
| Certificate appears **already expired** | **`critical`** |
| Expires in **≤14 or ≤30 days** | `medium` |
| Valid with comfortable window | `low` |
| Hostname mismatch vs cert names | `medium` |
| Verification / chain warning (`authorizationError`) | `medium` |
| No readable leaf certificate | `medium` |

## `critical` usage

Reserved for unmistakable breakage or imminent harm. **`tls_check` sets `critical` when the observed leaf validity end is already in the past.** Roadmap modules (e.g. confirmed leaks, dangerous exposures) should document rules in [Recon modules](recon-modules.md).

## User-facing copy

Findings include **`title`** and **`explanation`** for non-specialists. Prefer “what to do next” (renew cert, publish DMARC) over CVE jargon alone.

## Related

- [User guide](user-guide.md)
- [API reference](api-reference.md)
