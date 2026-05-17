# API reference

| Field | Value |
|-------|-------|
| **Status** | Live (reconcile with code during doc edits) |
| **Owner** | Product / Engineering |
| **Last updated** | 2026-05-17 |
| **Linked from** | [Def/Acc product hub](defacc-alignment-and-scoring-plan.md) |

## Purpose

Document HTTP APIs used by the dashboard and integrations. Canonical **module list** and skip rules: [Recon modules](recon-modules.md) and [`run-scan.ts`](../src/lib/recon/run-scan.ts).

## Goals

- **G1:** Accurate **request/response** shapes for `POST /api/scan`.
- **G2:** Surface **known gaps** between docs and deployment (rate limits, auth) honestly.

## Non-goals

- OpenAPI export (not required here); third-party API keys beyond what the app uses internally.

## Known gaps (**reconcile regularly**)

- **`POST /api/scan`** has **no enforced rate limit** in route code today — abuse risk called out in [threat model](threat-model.md) and [product hub §10](defacc-alignment-and-scoring-plan.md#10-risks-and-mitigations).
- **Deep scan ownership verification** is specified in [prd-domain-ownership-verification.md](prd-domain-ownership-verification.md) but **not implemented** yet (future `403 OWNERSHIP_REQUIRED`).

Base URL in local development: `http://localhost:3000`.

## `POST /api/scan`

Runs a passive scan via [`runScanModules`](../src/lib/recon/run-scan.ts). **Registered modules (six):**

- **`subdomain_enum`** — certificate transparency hostnames (**runs in `deep` only** for domains).
- **`dns_health`** — SPF / DMARC / common DKIM selector probes (**domain**).
- **`tls_check`** — TLS handshake to **`{domain}:443`**, leaf cert read (**domain**).
- **`tls_versions_check`** — legacy TLS negotiation probes (**`deep` + domain**).
- **`dns_auth_details`** — SPF/DMARC policy strictness (**`deep` + domain**).
- **`dns_caa_check`** — CAA at zone apex (**`deep` + domain**).

IPv4 scans **skip** domain-only modules. Optional **`mode`** `"quick" \| "deep"`: **`quick`** skips **`subdomain_enum`**, all **`deep`-only** modules, and **filters out `low`** severity findings from the response (defaults to **`deep`**).

Implemented in [`src/app/api/scan/route.ts`](../src/app/api/scan/route.ts). Runtime: **Node.js** (`export const runtime = "nodejs"`).

### Example response shape (conceptual)

A successful **`domain`** **`deep`** scan returns **`modules`** with up to **six** names and multiple **`findings`** (hostname footprint, SPF/DMARC/DKIM, TLS rows, optional legacy TLS / DMARC policy / CAA). Inspect `curl`/browser JSON while developing.

### Request

**Headers**

- `Content-Type: application/json`

**Body (JSON)**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `target` | `string` | Yes* | User input: domain, URL with hostname, or IPv4. |
| `mode` | `"deep" \| "quick"` | No | Defaults to **`deep`**. **`quick`**: skips CT and deep-only modules; omits **`low`** severity findings. Other values are treated as **`deep`**. |

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
| `mode` | `"deep" \| "quick"` | Echoes effective scan mode (`deep` default). |
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
| `metadata` | `Record<string, unknown>` (optional) | Extra data (e.g. CT `hostnames`, DNS check flags, TLS dates/issuer). |

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

**Example (IP — hostname-based modules skipped)**

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
    },
    {
      "name": "dns_health",
      "status": "skipped",
      "errorMessage": "DNS email-auth checks (SPF, DMARC, DKIM) apply to domain names, not a raw IP address."
    },
    {
      "name": "tls_check",
      "status": "skipped",
      "errorMessage": "TLS certificate inspection uses the hostname from HTTPS; enter a domain name for this check."
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

## `POST /api/ai/insights`

Generates **structured** defensive insights (executive summary, prioritized actions, per-finding snippets) from a minimal scan snapshot. Implemented in [`src/app/api/ai/insights/route.ts`](../src/app/api/ai/insights/route.ts).

### Request

Same snapshot fields as used by the dashboard (see [`AiInsightsRequestBody`](../src/types/ai-insights.ts)): `normalizedTarget`, `inputKind`, `scanMode`, hostname counts, `findings[]`, `modules[]`, optional `checklistRows[]`. **No bulk hostname lists** are sent to the model.

### Responses

- **`200`** — `AiInsightsResponseBody` (JSON).
- **`400`** — invalid body.
- **`502`** / **`503`** — model or configuration errors.

---

## `POST /api/ai/chat`

**Follow-up conversational layer** grounded in the **current scan snapshot** and optional prior structured insights. Requires **Clerk sign-in**. Implemented in [`src/app/api/ai/chat/route.ts`](../src/app/api/ai/chat/route.ts).

### Auth and limits

| Rule | Value |
|------|--------|
| Authentication | **Required** (`401` if unsigned) |
| Prior insights | **Required** — client must send `priorInsights` from a successful insights generation |
| Rate limit | **40 requests / hour / user** (in-memory per instance; `429` with `Retry-After`) |
| Max user turns / session | **10** (client-enforced; server validates message list) |
| Max message length | **2000** characters |

### Request body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `scanSnapshot` | `AiInsightsRequestBody` | Yes | Same minimal snapshot as insights |
| `priorInsights` | `AiInsightsResponseBody` | Yes | Last successful structured insights |
| `messages` | `{ role: "user" \| "assistant", content: string }[]` | Yes | Conversation thread; **last message must be `user`** |

**Example**

```json
{
  "scanSnapshot": { "normalizedTarget": "example.com", "inputKind": "domain", "scanMode": "deep", "totalHostnames": 12, "hostnameSampleShownCount": 12, "findings": [], "modules": [] },
  "priorInsights": { "executiveSummary": "…", "topActions": [], "disclaimers": ["…"], "perFindingInsightsById": {} },
  "messages": [
    { "role": "user", "content": "¿Qué debería verificar primero?" }
  ]
}
```

### Response — `200 OK`

| Field | Type | Description |
|-------|------|-------------|
| `reply` | `string` | Assistant answer (Spanish by default) |
| `citedFindingIds` | `string[]` (optional) | Finding ids referenced |
| `citedChecklistIds` | `string[]` (optional) | Checklist row ids referenced |
| `disclaimers` | `string[]` (optional) | Passive-scan caveats when relevant |
| `modelUsed` | `string` (optional) | OpenRouter model slug |

### Errors

| Status | When |
|--------|------|
| `401` | Not signed in |
| `400` | Invalid body, or missing `priorInsights` |
| `429` | Rate limit exceeded |
| `502` / `503` | Model / `OPENROUTER_API_KEY` errors |

Spec: [AI chat refinement PRD](ai-chat-refinement-prd.md).

---

## Related

- [Architecture](architecture.md) — end-to-end flow.
- [Troubleshooting](troubleshooting.md) — common API errors.
- [Def/Acc product hub](defacc-alignment-and-scoring-plan.md)
