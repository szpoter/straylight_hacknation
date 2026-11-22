import { describe, expect, it } from "vitest";
import { DEMO_PROFILE } from "@/features/auth/demo-session";
import { PARENT_PROFILE } from "@/lib/demo/fixtures";

const value = (label: string) => PARENT_PROFILE.find((r) => r.label === label)?.value.toLowerCase();
const demo = (label: string) => DEMO_PROFILE.insurance.find((r) => r.label === label)?.value.toLowerCase();

describe("profil po zalogowaniu = profil z ekranu logowania (SPEC.md „Dane z ZUS · przykład”)", () => {
  it("imię i nazwisko oraz trzy pozycje z ZUS się zgadzają", () => {
    expect(PARENT_PROFILE[0].value).toBe(`${DEMO_PROFILE.firstName} ${DEMO_PROFILE.lastName}`);
    expect(value("Ubezpieczenie chorobowe")).toBe(demo("Ubezpieczenie chorobowe"));
    expect(value("Tytuł ubezpieczenia")).toBe(demo("Tytuł ubezpieczenia"));
    expect(value("Początek okresu ubezpieczenia")).toBe(demo("Początek okresu ubezpieczenia"));
  });
});
