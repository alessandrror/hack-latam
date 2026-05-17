# Privacy & data sources

## What leaves this app today

| Destination | When | What is sent |
|-------------|------|--------------|
| **crt.sh** | `inputKind === "domain"` and `subdomain_enum` runs | HTTPS GET to `https://crt.sh/?q={encodeURIComponent("%.domain")}&output=json` |

The **User-Agent** header is set to `hack-latam-recon/0.1 (+https://github.com/)` in [`src/lib/recon/subdomains.ts`](../src/lib/recon/subdomains.ts). You may want to replace the URL with your real **repository or contact** page for responsible disclosure.

**IPv4-only input:** crt.sh is **not** called; the subdomain module is **skipped**.

## What crt.sh returns

Public JSON listing certificate log entries (fields such as `name_value`, `common_name`). The app parses hostnames and **does not** forward raw certificate rows to the browser except derived **hostname strings** and counts inside `findings[].metadata`.

## Data retained

- **No database** in this codebase — results exist in memory for the HTTP response and in the browser until refresh.
- Server logs (Next.js / hosting) may still record requests — configure hosting appropriately for demos.

## Recommended practices (operators)

1. **Scan only assets you own or have permission to assess.**
2. **Hackathon demos:** prefer domains you control or public examples agreed with organizers.
3. **Do not paste secrets** into the target field (not useful, could leak in logs).
4. If you add APIs requiring keys (Shodan, HIBP, etc.), store keys in environment variables and add **`.env.example`** without real secrets.

## Limitations & third-party dependency

- **crt.sh** is a free public service; it can be slow, rate-limited, or temporarily error-prone — users see module `error` with a message.
- **Completeness:** certificate transparency does not list all names ever used; some infra never appears in CT logs.

## Related

- [Threat model](threat-model.md)
- [Recon modules](recon-modules.md)
- [Troubleshooting](troubleshooting.md)
