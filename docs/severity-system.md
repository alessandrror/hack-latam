# Severity system

Severities are defined in TypeScript as:

```ts
type Severity = "critical" | "medium" | "low";
```

Every **`ScanFinding`** must include one of these values. The UI renders colored badges for each.

## Design intent (product)

From [CONTEXT.md](../CONTEXT.md):

- **Critical** — immediate risk (e.g. exposed high-risk service, leaked credentials).
- **Medium** — misconfiguration that could be exploited.
- **Low** — missing best practice or informational exposure with lower direct impact.

## What the code does today

Only **`subdomain_enum`** (crt.sh) emits findings. Its logic uses **`medium` and `low` only** — not `critical`.

Source: [`src/lib/recon/subdomains.ts`](../src/lib/recon/subdomains.ts) — `severityForSubdomainCount`:

| Hostname count (after dedupe) | Severity |
|-------------------------------|----------|
| **0** | `low` — “no names in cert logs” is informational; not proof of safety. |
| **1–50** | `low` — “several names” / larger footprint to monitor. |
| **> 50** | `medium` — “many names” — more surface area for weak configs. |

**Examples**

- **Low:** “`5` hostname(s) found via certificate transparency” — more DNS names to maintain; not a vulnerability by itself.
- **Medium:** “`80` hostname(s) found…” — same data source, higher count upgrades narrative urgency.

## `critical` today

The type allows **`critical`** for future modules (e.g. confirmed leaked credentials or clearly dangerous exposures). **No current module assigns `critical`.** If you add a module that sets `critical`, document the rule next to that module in [Recon modules](recon-modules.md).

## User-facing copy

Findings always include a **`title`** and **`explanation`** meant for non-specialists. Prefer “what to do next” in future modules (rotate creds, close port, fix DMARC) over raw CVE jargon.

## Related

- [User guide](user-guide.md)
- [API reference](api-reference.md)
