# Troubleshooting

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

## Module `subdomain_enum` → `skipped`

**Expected** when `inputKind` is **`ip`**. Use a **domain name** to run certificate transparency lookup.

## Empty `findings` but module `ok`

Possible when the module returns a finding with **zero hostnames** — you should still get one **finding** explaining “none in cert logs” for domains. If `findings` is empty and module is `ok`, verify you are not misreading a skipped path or failed parse (should not happen on success path).

## Development tips

- Watch terminal logs for server-side stack traces.
- Reproduce with `curl` (see [API reference](api-reference.md)).
- Inspect `modules[].errorMessage` in JSON responses.

## Related

- [API reference](api-reference.md)
- [Privacy & data sources](privacy-and-data-sources.md)
