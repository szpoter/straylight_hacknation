import { describe, expect, it } from "vitest";
import { childName, childrenGenitive, childrenLabel } from "@/features/family/family-name";
import { DEMO_TODAY } from "@/lib/demo/dates";
import { DEFAULT_PLAN_ID } from "@/lib/demo/fixtures";
import { SCENARIOS, SCENARIO_PLANS, familyOf, scenarioOf } from "@/lib/demo/scenarios";
import { buildPlan, buildPlans } from "@/lib/plan/build";
import { familyScopeSchema } from "@/lib/zusik/family-chat";

const scenario = (id: string) => SCENARIOS.find((s) => s.id === id)!;

describe("gotowe scenariusze na /start", () => {
  it("Ola jest pierwsza, a plany mają unikalne id przyjmowane przez czat", () => {
    expect(SCENARIOS.map((s) => s.id)).toEqual([DEFAULT_PLAN_ID, "lena-kuba", "antek"]);
    const ids = SCENARIO_PLANS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(familyScopeSchema.safeParse({ planId: id }).success).toBe(true);
  });

  it("Lena i Kuba to bliźnięta: osobne plany i dłuższy urlop macierzyński", () => {
    const [lena, kuba] = scenario("lena-kuba").plans;
    expect([lena.name, kuba.name]).toEqual(["Lena", "Kuba"]);
    expect(kuba.family).toMatchObject({ label: "bliźnięta", primaryPlanId: lena.id });
    expect(lena.stops.find((s) => s.id === "zglos-urodzenie")!.title).toBe("Zgłoś urodzenie Leny");
    expect(lena.stops.find((s) => s.id === "zasilek-macierzynski")!.notes?.[0].text).toContain("31 tygodni");
  });

  it("Antek ma 4 miesiące i nie ma zaległych terminów", () => {
    const [antek] = scenario("antek").plans;
    expect(antek.stage).toBe("po");
    expect(antek.stops.find((s) => s.id === "zglos-urodzenie")).toMatchObject({ state: "zalatwione", due: undefined });
    expect(antek.stops.find((s) => s.id === "rodzicielski")!.state).toBe("aktualna");
  });

  it("żaden scenariusz nie zaczyna się od przekroczonego terminu", () => {
    const overdue = SCENARIO_PLANS.flatMap((p) => p.stops.filter((s) => s.state === "aktualna" && s.due && s.due < DEMO_TODAY).map((s) => `${p.id}/${s.id}`));
    expect(overdue).toEqual([]);
  });
});

describe("nazwy rodziny w pasku i Profilu", () => {
  it("odmienia imiona dzieci wybranego scenariusza", () => {
    const [ola] = scenario(DEFAULT_PLAN_ID).plans;
    const [lena] = scenario("lena-kuba").plans;
    const [antek] = scenario("antek").plans;
    expect([childName(ola), childrenLabel(ola), childrenGenitive(ola)]).toEqual(["Ola Lis", "Ola Lis", "Oli Lis"]);
    expect([childName(lena), childrenLabel(lena), childrenGenitive(lena)]).toEqual(["Lena", "Lena i Kuba", "Leny i Kuby"]);
    expect(childrenGenitive(antek)).toBe("Antka");
  });

  it("plan bez imienia nie ma rodziny do odmiany", () => {
    expect(childrenGenitive(buildPlan({ situation: "urodzone", date: "2026-11-10" }, "bez-imienia"))).toBeUndefined();
    expect(childrenGenitive(buildPlan({ situation: "ciaza", date: "2027-05-14" }, "ciaza"))).toBeUndefined();
  });
});

describe("rodziny w selektorze dziecka", () => {
  const plan = (id: string) => SCENARIO_PLANS.find((p) => p.id === id)!;

  it("gotowy scenariusz pokazuje tylko swoje dzieci", () => {
    expect(familyOf(SCENARIO_PLANS, plan("lena-kuba-2")).map((p) => p.name)).toEqual(["Lena", "Kuba"]);
    expect(familyOf(SCENARIO_PLANS, plan("antek")).map((p) => p.name)).toEqual(["Antek"]);
    expect(familyOf(SCENARIO_PLANS, plan(DEFAULT_PLAN_ID)).map((p) => p.id)).toEqual([DEFAULT_PLAN_ID]);
  });

  it("dziecko dodane do rodziny trafia za dzieci, od których rodzina się zaczęła", () => {
    const later = { ...buildPlan({ situation: "ciaza", date: "2027-05-14" }, "plan-1800000000000"), scenario: "antek" };
    const earlier = { ...buildPlan({ situation: "urodzone", date: "2026-11-01", name: "Maja" }, "plan-1700000000000"), scenario: "antek" };
    const all = [later, earlier, ...SCENARIO_PLANS];
    expect(familyOf(all, plan("antek")).map((p) => p.id)).toEqual(["antek", earlier.id, later.id]);
    expect(familyOf(all, plan("lena-kuba-1")).map((p) => p.name)).toEqual(["Lena", "Kuba"]);
  });

  it("nowa rodzina z onboardingu i plany sprzed podziału tworzą własne rodziny", () => {
    const twins = buildPlans({ situation: "urodzone", date: "2026-11-01", childCount: "2", names: ["Ala", "Ola"] }, "plan-1").map((p) => ({ ...p, scenario: "plan-1" }));
    const legacy = buildPlan({ situation: "urodzone", date: "2026-10-01", name: "Jaś" }, "plan-2");
    expect(scenarioOf(legacy)).toBe("plan-2");
    const all = [...twins, legacy, ...SCENARIO_PLANS];
    expect(familyOf(all, twins[1]).map((p) => p.name)).toEqual(["Ala", "Ola"]);
    expect(familyOf(all, legacy).map((p) => p.name)).toEqual(["Jaś"]);
  });
});
