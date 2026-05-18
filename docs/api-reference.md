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
- **`POST /api/ai/insights`** and **`POST /api/ai/chat`** require Clerk session but **no rate limit** is implemented in the route yet.
- **Deep scan ownership verification** is specified in [prd-domain-ownership-verification.md](prd-domain-ownership-verification.md) but **not implemented** yet (future `403 OWNERSHIP_REQUIRED`).

Base URL in local development: `http://localhost:3000`.

## `POST /api/scan`

Runs a passive scan via [`runScanModules`](../src/lib/recon/run-scan.ts). **Registered modules (seven):**

- **`subdomain_enum`** — certificate transparency hostnames (**runs in `deep` only** for domains).
- **`dns_health`** — SPF / DMARC / common DKIM selector probes (**domain**).
- **`tls_check`** — TLS handshake to **`{domain}:443`**, leaf cert read (**domain**).
- **`tls_versions_check`** — legacy TLS negotiation probes (**`deep` + domain**).
- **`dns_auth_details`** — SPF/DMARC policy strictness (**`deep` + domain**).
- **`dns_caa_check`** — CAA at zone apex (**`deep` + domain**).
- **`osint_passive`** — Passive OSINT (**`security.txt`**, HTTPS headers, MTA‑STS/TLS‑RPT/BIMI TXT, apex DNSSEC hint); targets the **normalized primary hostname plus same‑apex RHS domains extracted from pasted `emails`** (optional request field).

IPv4 scans **skip** hostname-only modules. Optional **`mode`** `"quick" \| "deep"`: **`quick`** skips **`subdomain_enum`**, all **`deep`-only** modules, and filters out most **`low`** severity findings (**`osint_passive` lows are retained**).

**Auth / ownership:**

- **`quick`** scans do **not** require sign-in today.
- **`deep`** scans require Clerk session **plus** Convex **verified apex** alignment (unless the apex is configured as a bypass demo list — see [`ownership-bypass.ts`](../src/lib/verify/ownership-bypass.ts)). Expect `403` with `OWNERSHIP_REQUIRED` when unverified.

Implemented in [`src/app/api/scan/route.ts`](../src/app/api/scan/route.ts). Runtime: **Node.js** (`export const runtime = "nodejs"`).

### Example response shape (conceptual)

A successful **`domain`** **`deep`** scan returns **`modules`** with up to **seven** names and **`findings`** spanning CT/DNS/TLS/OSINT/email hygiene.

### Request

**Headers**

- `Content-Type: application/json`

**Body (JSON)**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `target` | `string` | Yes* | User input: domain, URL with hostname, or IPv4. |
| `mode` | `"deep" \| "quick"` | No | Defaults to **`deep`**. **`quick`**: skips CT and deep-only modules; omits **`low`** severity findings unless the module is **`osint_passive`**. |
| `emails` | `string \| string[]` | No | Free-form pasted mailboxes (**≤50 whitespace/comma-separated tokens**, **≤10 unique RHS domains** server-side). Only domains under the registrable apex of `target` are scanned; mailbox locals never persist server-side beyond the audit summary. Omit or leave blank to disable this path. |

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
| `findings` | `ScanFinding[]` | Risk items (may be empty, e.g. IP-only skippage). May include **`osint_passive`** findings with `metadata.subjectSource`. |
| `modules` | `ScanModuleResult[]` | Per-module execution summary (`osint_passive` included last by default grouping). |
| `emailDomainSummary` | [`EmailDomainSummary`](../src/types/scan.ts) (optional) | Present when **`emails`** body was non-empty after trim — lists eligible/skipped apex domains plus truncation flags (**no mailbox parts**). |

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

Genera el JSON estructurado de IA (`AiInsightsResponseBody`) a partir de una instantánea mínima del escaneo. Implementado en [`src/app/api/ai/insights/route.ts`](../src/app/api/ai/insights/route.ts) (Node.js).

### Auth

- **Requiere sesión Clerk** (cookie). Sin sesión: **`401`** con mensaje en español.

### Caché (Convex)

- Busca primero en `aiInsightsCache` por `normalizedTarget` (TTL 24h). La clave **no incluye** `mode`; quick y deep comparten la misma fila si el objetivo coincide.
- Para forzar llamada al modelo: envía `"forceRefresh": true` en el cuerpo.
- Escritura en caché usa `INSIGHTS_CACHE_WRITE_SECRET` en Convex y Next (ver `.env.example`).

### Persistencia de IA en `scans` (opcional)

- Si el cliente envía `"convexScanId"` (id devuelto por la mutación `scans.createScan` tras un escaneo con sesión), el servidor intenta `updateScanInsights` con el JWT del usuario.

### Request

**Body (JSON)** — además de los campos anteriores:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `convexScanId` | `string` | No | Id de documento `scans` para guardar IA en Convex. |
| `forceRefresh` | `boolean` | No | Omite caché y vuelve a llamar al modelo. |

Respuesta exitosa puede incluir `servedFromCache: true` y `modelUsed`.

## `POST /api/ai/chat`

Chat de refinamiento **posterior** a haber obtenido insights estructurados. Implementado en [`src/app/api/ai/chat/route.ts`](../src/app/api/ai/chat/route.ts).

### Auth

- **Requiere sesión Clerk**. Sin sesión: **`401`**.

### Request

**Body (JSON)**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `scanSnapshot` | objeto | Sí | Misma forma mínima que el cuerpo de insights (`normalizedTarget`, `inputKind`, `scanMode`, `totalHostnames`, `hostnameSampleShownCount`, `findings[]`, `modules[]`, `checklistRows` opcional). |
| `priorInsights` | objeto | Sí | Resultado JSON previo de `POST /api/ai/insights` (`executiveSummary`, `topActions`, `disclaimers`, `perFindingInsightsById`, …). |
| `messages` | array | Sí | `{ "role": "user" \| "assistant", "content": string }[]` — debe existir al menos un mensaje `user` con contenido no vacío (la última pregunta). |

### Response — `200 OK`

JSON: `{ "reply": string, "citedFindingIds"?: string[], "disclaimers"?: string[], "modelUsed"?: string }` (texto modelo en **español**).

### Notas

- **No hay caché** de turnos de chat en MVP ([ai-chat-refinement-prd](ai-chat-refinement-prd.md)).
- La UI aún puede no estar cableada; el contrato HTTP queda listo para integración.

## Related

- [Architecture](architecture.md) — end-to-end flow.
- [Troubleshooting](troubleshooting.md) — common API errors.
- [Def/Acc product hub](defacc-alignment-and-scoring-plan.md)
