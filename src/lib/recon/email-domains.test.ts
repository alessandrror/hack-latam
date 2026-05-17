import { describe, expect, it } from "vitest";

import {
  buildPassiveOsintHostnames,
  classifyHostsByPrimaryApex,
  OSINT_EMAIL_MAX_LINES,
  OSINT_EMAIL_MAX_UNIQUE_HOSTS,
  parseEmailLinesForDomains,
  splitEmailLocalAndDomain,
} from "@/lib/recon/email-domains";

describe("splitEmailLocalAndDomain", () => {
  it("uses the last @ for odd locals", () => {
    expect(splitEmailLocalAndDomain("a@b@c.example.com")).toEqual({
      local: "a@b",
      domainSide: "c.example.com",
    });
  });

  it("strips brackets", () => {
    expect(splitEmailLocalAndDomain("<x@example.com>")).toEqual({
      local: "x",
      domainSide: "example.com",
    });
  });

  it("rejects bogus tokens", () => {
    expect(splitEmailLocalAndDomain("not-an-email")).toBeNull();
    expect(splitEmailLocalAndDomain("@nope")).toBeNull();
  });
});

describe("parseEmailLinesForDomains", () => {
  it("dedupes and normalizes hostnames", () => {
    const r = parseEmailLinesForDomains("a@mail.example.com, b@mail.example.com");
    expect(r.uniqueHosts).toEqual(["mail.example.com"]);
    expect(r.parsedLineCount).toBe(2);
  });

  it("caps unique domains beyond OSINT_EMAIL_MAX_UNIQUE_HOSTS", () => {
    const parts: string[] = [];
    for (let i = 0; i < OSINT_EMAIL_MAX_UNIQUE_HOSTS + 3; i++) {
      parts.push(`x${i}@host${i}.example.com`);
    }
    const r = parseEmailLinesForDomains(parts.join(" "));
    expect(r.uniqueHosts.length).toBe(OSINT_EMAIL_MAX_UNIQUE_HOSTS);
    expect(r.truncatedDomainList).toBe(true);
  });

  it("flags truncation when tokens exceed OSINT_EMAIL_MAX_LINES", () => {
    const parts = Array.from(
      { length: OSINT_EMAIL_MAX_LINES + 5 },
      (_, i) => `u${i}@example.com`,
    );
    const r = parseEmailLinesForDomains(parts.join(" "));
    expect(r.truncatedEmailList).toBe(true);
    expect(r.parsedLineCount).toBe(OSINT_EMAIL_MAX_LINES);
  });
});

describe("classifyHostsByPrimaryApex", () => {
  it("filters to same apex", () => {
    const x = classifyHostsByPrimaryApex("example.com", [
      "mail.example.com",
      "other.net",
      "www.example.com",
    ]);
    expect(x.eligible.slice().sort()).toEqual(["example.com", "mail.example.com"]);
    expect(x.skippedExternal).toEqual(["other.net"]);
  });

  it("sends everything to skipped when primary apex missing", () => {
    const x = classifyHostsByPrimaryApex(null, ["a.example.com"]);
    expect(x.eligible).toEqual([]);
    expect(x.skippedExternal).toEqual(["a.example.com"]);
  });
});

describe("buildPassiveOsintHostnames", () => {
  it("combines domain target with eligible hosts", () => {
    expect(
      buildPassiveOsintHostnames({
        primaryNormalizedHost: "www.example.com",
        inputKind: "domain",
        classifiedEligibleEmailHosts: ["mail.example.com"],
      }).sort(),
    ).toEqual(["example.com", "mail.example.com"].sort());
  });

  it("omits domain target for IP scans", () => {
    expect(
      buildPassiveOsintHostnames({
        primaryNormalizedHost: null,
        inputKind: "ip",
        classifiedEligibleEmailHosts: [],
      }),
    ).toEqual([]);
  });
});
