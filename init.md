Fine. Here is the architecture I propose for the hackathon:

---

**Stack**

- **Frontend:** Next.js + Tailwind — results dashboard
- **Backend:** Next.js API Routes (or a small separate Python server if you need to run recon tools that only exist in Python)
- **Recon:** combination of public APIs + CLI tools

---

**Scan Engine — what to cover**

| Module           | What it does                 | Tool/API                |
| ---------------- | ---------------------------- | ----------------------- |
| Subdomain enum   | Discovers active subdomains  | crt.sh API + DNS lookup |
| Port scan        | Open ports on IPs            | Shodan API (free tier)  |
| SSL/TLS          | Expired, misconfigured certs | SSL Labs API            |
| DNS records      | SPF, DMARC, DKIM presence    | Direct DNS queries      |
| WHOIS / ASN      | Registrant info, provider    | WHOIS API               |
| Exposed services | Exposed RDP, FTP, Telnet     | Shodan                  |
| Leaked creds     | Leaked emails/passwords      | HaveIBeenPwned API      |

---

**User Flow**

1. Enters domain / IPs / company name
2. The backend launches modules in parallel
3. Results arrive progressively at the dashboard (streaming or polling)
4. Each finding has a **severity tag** (critical / medium / low) and a single line explaining the risk in plain language

---

**What makes it winnable in the hackathon**

- Flexible input (domain + IPs + name) already sets it apart from generic tools
- The "for SMBs without a technical team" framing justifies the plain language in the results
- Shodan + crt.sh + HIBP are free and fast APIs — highly demonstrable live

---

Do you want me to start with the project scaffold (folder structure, API routes, first functional recon module)?

**Update (current repo):** new modules register in [`src/lib/recon/run-scan.ts`](src/lib/recon/run-scan.ts); the API route delegates to [`runScanModules`](src/lib/recon/run-scan.ts).
