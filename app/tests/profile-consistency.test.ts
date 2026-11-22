import { describe, expect, it } from "vitest";
import { DEMO_PROFILE } from "@/features/auth/demo-session";
import { DEFAULT_PLAN_ID, getPlan, PARENT_PROFILE } from "@/lib/demo/fixtures";
import { demoProfile } from "@/features/documents/flow";
import { OLA } from "@/lib/family/ola";

describe("profil rodziny Oli", () => {
  it("łączy plan, profil i dane wnioskodawczyni", () => {
    expect(getPlan(DEFAULT_PLAN_ID).keyDate).toBe("2026-11-10");
    expect(`${DEMO_PROFILE.firstName} ${DEMO_PROFILE.lastName}`).toBe(OLA.mother);
    expect(PARENT_PROFILE.find(row => row.label === "Drugi rodzic")?.value).toBe(OLA.father);
    expect(demoProfile()).toEqual({ parentName: OLA.mother, employer: OLA.employer });
  });
});
