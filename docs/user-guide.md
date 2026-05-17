# User guide

| Field | Value |
|-------|-------|
| **Status** | Live |
| **Owner** | Product / Engineering |
| **Last updated** | 2026-05-17 |
| **Linked from** | [Def/Acc product hub](defacc-alignment-and-scoring-plan.md) |

## Purpose

Help **end users** run a scan and interpret **modules**, **findings**, and **quick vs deep** behavior.

## Goals

- **G1:** Reduce jargon friction (link out to severity + recon docs).
- **G2:** Reinforce **authorized / passive** scope ([Threat model](threat-model.md)).

## Non-goals

- Step-by-step DNS remediation for every provider (only high-level expectations).

## Personas and scan modes

| Persona | Typical mode | Notes |
|---------|--------------|--------|
| **SMB operator** (first visit) | **Quick** | Smaller signal set; **`low`** findings filtered out of API response |
| **Power user / demo** | **Deep** | All six modules for **domains**; CT + TLS versions + auth details + CAA ([Recon modules](recon-modules.md)) |

## How to run a scan (web UI)

1. Open the app locally after `pnpm dev` (see [Developer setup](developer-setup.md) or the root [README](../README.md)).
2. In **Target domain or URL**, enter:
   - `example.com`
   - `https://www.example.com`
3. Click **Start scan**.
4. Wait for the single response (there is no live streaming of partial results in the UI yet).

Supported input shapes are described in [API reference](api-reference.md) and implemented in `classifyAndNormalizeTarget` (see [Architecture](architecture.md)).

## Reading the results

### Normalized target

You’ll see the hostname or IP the server used after parsing, plus `domain` or `ip` as the **input kind**.

### Modules

Each row is one recon **module**:

- **ok** — completed successfully.
- **error** — failed (message explains why when available).
- **skipped** — not applicable for this input (domain-only checks are skipped when you enter a bare **IPv4**).

Implemented modules are listed in [Recon modules](recon-modules.md): **`subdomain_enum`**, **`dns_health`**, **`tls_check`**, **`tls_versions_check`** (deep), **`dns_auth_details`** (deep), **`dns_caa_check`** (deep). **`Quick`** skips CT and deep-only modules.

### Findings

Each finding includes:

- **Severity** — `critical`, `medium`, or `low` (see [Severity system](severity-system.md)).
- **Title** — short headline.
- **Explanation** — one plain-language line about why it matters.
- **Metadata** (optional):
  - **Subdomains**: scrollable hostname list (may be truncated for display).
  - **DNS / TLS**: key-value snapshots (presence of SPF/DMARC, DKIM selectors hit, certificate dates, issuer).

## What “passive” means here

The app is designed for **defense / resilience**: it uses **public datasets, DNS lookups, and a normal HTTPS handshake** on your target — not exploitation. Details: [Threat model](threat-model.md) and [Privacy & data sources](privacy-and-data-sources.md).

## Limitations you should know

- **Not every asset** appears in public cert logs; **zero subdomains** in crt.sh does not guarantee you have none.
- **DKIM detection** probes only **common selector names** — your provider might use others; absence here is **not** proof DKIM is off.
- **TLS check** connects to port **443** only; expired or mismatched certs on **other** ports are out of scope.
- **Roadmap** items (ports, WHOIS/HIBP, deep SSL grading, streaming UI) remain future work — see [Recon modules](recon-modules.md).

## Related

- [API reference](api-reference.md)
- [Def/Acc product hub](defacc-alignment-and-scoring-plan.md)

## FAQ

**Why did subdomain / DNS / TLS skip for my IP?**  
Those steps are keyed to a **domain name**. For IP-only input, they are intentionally skipped with an explanation.

**Is this legal / ethical?**  
Only use it on **targets you’re allowed to assess**. The tool is meant for **authorized** owners or educators. See [Threat model](threat-model.md).
