import { describe, expect, it } from "vitest";
import { SITUATION_LABEL, SUPPORT_ORGANIZATIONS, isStale, organizationsFor } from "@/lib/support/organizations";

describe("support organisations", () => {
  it("lists only foundations and associations with a KRS number and an https site", () => {
    for (const o of SUPPORT_ORGANIZATIONS) {
      expect(["fundacja", "stowarzyszenie"]).toContain(o.legalForm);
      expect(o.krs).toMatch(/^\d{10}$/);
      expect(new URL(o.url).protocol).toBe("https:");
      expect(o.situations.length).toBeGreaterThan(0);
      expect(o.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(new Set(SUPPORT_ORGANIZATIONS.map((o) => o.id)).size).toBe(SUPPORT_ORGANIZATIONS.length);
  });

  it("covers the situations named in the task", () => {
    for (const s of ["strata-dziecka", "poronienie", "wczesniak", "ciezko-chore-dziecko"] as const) {
      expect(organizationsFor(s).length, SITUATION_LABEL[s]).toBeGreaterThan(0);
    }
  });

  it("flags entries older than six months", () => {
    expect(isStale("2026-11-22", "2027-05-01")).toBe(false);
    expect(isStale("2026-11-22", "2027-06-01")).toBe(true);
  });
});
