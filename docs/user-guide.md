# User guide

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
- **skipped** — not applicable for this input (e.g. subdomain discovery from cert logs needs a **domain**, not a raw IP).

### Findings

Each finding includes:

- **Severity** — `critical`, `medium`, or `low` (see [Severity system](severity-system.md)).
- **Title** — short headline.
- **Explanation** — one plain-language line about why it matters.
- **Metadata** (optional) — e.g. a scrollable list of hostnames; lists may be **truncated** for display.

## What “passive” means here

The app is designed for **defense / resilience**: it uses **public datasets and normal lookups**, not exploitation. Details: [Threat model](threat-model.md) and [Privacy & data sources](privacy-and-data-sources.md).

## Limitations you should know

- **Not every asset** appears in public cert logs; **zero subdomains** in crt.sh does not guarantee you have none.
- **Planned modules** (ports, SSL labs, DNS auth records, etc.) are described in [Recon modules](recon-modules.md) — many are **not implemented** in code yet.

## FAQ

**Why did subdomain scan skip for my IP?**  
Certificate transparency subdomain discovery is keyed off a **domain name**. For an IP-only input, that module is intentionally skipped with an explanation.

**Is this legal / ethical?**  
Only use it on **targets you’re allowed to assess**. The tool is meant for **authorized** owners or educators. See [Threat model](threat-model.md).
