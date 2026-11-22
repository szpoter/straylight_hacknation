import { describe, expect, it } from "vitest";
import { getPlan } from "../src/lib/demo/fixtures";
import { docStatus } from "../src/lib/plan/status";
import { OLA } from "../src/lib/family/ola";
import type { MartaView } from "../src/lib/marta/types";
import { planAnswer, sessionLeaveStatus } from "../src/lib/zusik/plan-answer";

const local = { plan: getPlan("ola"), isPatched: () => false };

describe("current plan in the general chat", () => {
  it("reads the merged state and parent provenance, including specific cases after a summary", () => {
    const plan = { ...local.plan, stops: local.plan.stops.map(s => s.id === "800plus" ? { ...s, state: "wezwanie" as const } : s) };
    const edited = { plan, isPatched: (id: string) => id === "800plus" };
    const summary = planAnswer("Jaki jest stan moich wniosków?", edited);
    expect(summary?.lines).toContain("Wniosek o 800+ — Do uzupełnienia po wezwaniu (zmiana zapisana przez Ciebie).");
    expect(summary?.source).toContain("w tej przeglądarce");
    expect(summary?.source).toContain("ZUS nie potwierdza");
    expect(planAnswer("A 800+?", edited, summary ?? undefined)?.caseIds).toEqual(["800plus"]);
    expect(planAnswer("Skąd to wiesz?", edited, summary ?? undefined)?.source).toBe(summary?.source);
  });

  it("uses the selected stop and lets an explicitly named case override it", () => {
    const inDocument = { ...local, selectedStopId: "urlop-macierzynski" };
    expect(planAnswer("Jaki jest status tego wniosku?", inDocument)?.lines).toEqual([
      "Wniosek o urlop macierzyński — " + docStatus("wyslano").label + " (z planu).",
    ]);
    expect(planAnswer("Jaki jest status wniosku o 800+?", inDocument)?.caseIds).toEqual(["800plus"]);
    expect(planAnswer("Jaki jest status wniosku o dodatek mieszkaniowy?", local)?.caseIds).toEqual([]);
    expect(planAnswer("Które wnioski już wysłałam?", local)?.caseIds).not.toContain("zasilek-macierzynski");
  });

  it("reads the demo family and a changed date from the active plan; isolates other profiles", () => {
    const profile = planAnswer("Co wiesz o rodzinie Oli?", local);
    for (const value of [OLA.mother, OLA.father, OLA.child, OLA.employer, "10 listopada 2026"]) {
      expect(profile?.lines.join(" ")).toContain(value);
    }
    const edited = { ...local, plan: { ...local.plan, keyDate: "2026-11-12" } };
    expect(planAnswer("Kiedy urodziła się Ola?", edited)?.lines.join(" ")).toContain("12 listopada 2026");
    const other = { ...local, plan: { ...local.plan, id: "inny-plan", name: "Inne dziecko" } };
    expect(planAnswer("Co wiesz o mojej rodzinie?", other)?.lines.join(" ")).not.toMatch(/Marta|Paweł|Studio Lipa/);
  });

  it("keeps opening hours, eligibility, legal rules and official status checks in public retrieval", () => {
    for (const q of ["Na czyje konto ZUS wypłaca świadczenie?", "Kiedy składa się wniosek o urlop rodzicielski?",
      "Jak sprawdzić status wniosku 800+ w eZUS?", "Co oznacza status wniosku na PUE?", "Kto wypłaca mojej rodzinie 800+?"]) {
      expect(planAnswer(q, local)).toBeNull();
    }
  });

  it("only relates the separate saved leave draft to its matching demo family", () => {
    const view = { firstName: OLA.mother, childName: OLA.child, confirmed: true } as MartaView;
    expect(sessionLeaveStatus(view)).toContain("zatwierdzony");
    expect(sessionLeaveStatus({ ...view, submitted: true })).toContain("rodzic oznaczył samodzielne przekazanie pracodawcy");
    expect(sessionLeaveStatus({ ...view, childName: "Inna Rodzina" })).toBeNull();
    expect(sessionLeaveStatus(null)).toBeNull();
    expect(planAnswer("Jaki jest status urlopu rodzicielskiego?", local)?.readLeave).toBe(true);
  });
});
