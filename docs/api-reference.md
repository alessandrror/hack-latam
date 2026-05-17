# API reference

Base URL in local development: `http://localhost:3000`.

## `POST /api/scan`

Runs a scan for a single target. Implemented in [`src/app/api/scan/route.ts`](../src/app/api/scan/route.ts). Runtime: **Node.js** (`export const runtime = "nodejs"`).

### Request

**Headers**

- `Content-Type: application/json`

**Body (JSON)**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `target` | `string` | Yes* | User input: domain, URL with hostname, or IPv4. |

\* If `target` is missing or not a string, it is treated as empty and validation fails.

**Example**

```http
POST /api/scan HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{"target":"https://www.example.com/path"}
```

```bash
curl -sS -X POST http://localhost:3000/api/scan \
  -H 'Content-Type: application/json' \
  -d '{"target":"example.com"}'
```

### Responses

#### Success — `200 OK`

JSON body matches **`ScanResponseBody`** (see [`src/types/scan.ts`](../src/types/scan.ts)):

| Field | Type | Description |
|-------|------|-------------|
| `target` | `string` | Original `target` string from the request. |
| `normalizedTarget` | `string` | Parsed hostname (lowercased, no `www.`) or IPv4. |
| `inputKind` | `"domain" \| "ip" \| "unknown"` | Classification; successful scans use `domain` or `ip`. |
| `findings` | `ScanFinding[]` | Risk items (may be empty, e.g. IP-only skippage). |
| `modules` | `ScanModuleResult[]` | Per-module execution summary. |

**`ScanFinding`**

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Stable id for the finding. |
| `module` | `string` | Module name (e.g. `subdomain_enum`). |
| `severity` | `"critical" \| "medium" \| "low"` | Severity tier. |
| `title` | `string` | Short headline. |
| `explanation` | `string` | Plain-language risk line. |
| `metadata` | `Record<string, unknown>` (optional) | Extra data (e.g. `hostnames`, `totalHostnames`). |

**`ScanModuleResult`**

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Module name. |
| `status` | `"ok" \| "error" \| "skipped"` | Outcome. |
| `durationMs` | `number` (optional) | Wall time when applicable. |
| `errorMessage` | `string` (optional) | Human-readable error or skip reason. |

**Example (domain with successful subdomain module)**

```json
{
  "target": "example.com",
  "normalizedTarget": "example.com",
  "inputKind": "domain",
  "findings": [
    {
      "id": "subdomain-enum-crt-example.com",
      "module": "subdomain_enum",
      "severity": "low",
      "title": "20 hostname(s) found via certificate transparency",
      "explanation": "Certificate transparency logs list several hostnames for this domain — more names usually means more places to keep patched and monitored.",
      "metadata": {
        "source": "crt.sh",
        "hostnames": ["www.example.com"],
        "totalHostnames": 20,
        "truncatedListMax": 200
      }
    }
  ],
  "modules": [
    {
      "name": "subdomain_enum",
      "status": "ok",
      "durationMs": 1234
    }
  ]
}
```

**Example (IP — subdomain module skipped)**

```json
{
  "target": "203.0.113.10",
  "normalizedTarget": "203.0.113.10",
  "inputKind": "ip",
  "findings": [],
  "modules": [
    {
      "name": "subdomain_enum",
      "status": "skipped",
      "errorMessage": "Subdomain discovery via certificate transparency needs a domain name, not a raw IP address."
    }
  ]
}
```

#### Error — `400 Bad Request`

| Condition | Body |
|-----------|------|
| Body is not valid JSON | `{ "error": "Invalid JSON body." }` |
| Target empty or not a valid domain/URL hostname / IPv4 | `{ "error": "Enter a domain name or URL (for example example.com or https://example.com)." }` |

### Input normalization rules (summary)

Implemented in [`src/lib/recon/normalize-target.ts`](../src/lib/recon/normalize-target.ts):

- URLs: `hostname` is extracted; path/query ignored for classification.
- **IPv4** regex match → `inputKind: "ip"`.
- Domain-like label → lowercased, leading `www.` stripped, `inputKind: "domain"`.
- Company names, IPv6, or malformed hostnames → **`unknown`** → **400**.

## Related

- [Architecture](architecture.md) — end-to-end flow.
- [Troubleshooting](troubleshooting.md) — common API errors.
