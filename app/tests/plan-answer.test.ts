import { describe, expect, it } from "vitest";
import { getPlan } from "../src/lib/demo/fixtures";
import { importFamilyProfile } from "../src/lib/family/import-profile";
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
    expect(summary?.lines).toContain("Wniosek o 800+ — Do uzupełnienia po wezwaniu.");
    expect(summary?.lines.join(" ")).not.toMatch(/pochodz|z planu|przeglądar|zmiana zapisana|mObywatel|mZUS|demonstracji/);
    expect(planAnswer("A 800+?", edited, summary ?? undefined)?.caseIds).toEqual(["800plus"]);
    const sources = planAnswer("Skąd to wiesz?", edited, summary ?? undefined);
    expect(sources?.lines.join(" ")).toMatch(/symulujemy import.*mObywatel i mZUS/);
    expect(sources?.lines.join(" ")).toContain("Rodzic zmienił status");
  });

  it("uses the selected stop and lets an explicitly named case override it", () => {
    const inDocument = { ...local, selectedStopId: "urlop-macierzynski" };
    expect(planAnswer("Jaki jest status tego wniosku?", inDocument)?.lines).toEqual([
      "Wniosek o urlop macierzyński — " + docStatus("wyslano").label + ".",
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

  it("uses the signed-in family snapshot and keeps insurance and employment bound to their owner", () => {
    const family = { ...importFamilyProfile(), employer: "Studio Testowe", birthDate: "2026-11-14", insuranceTitle: "Umowa zlecenia" };
    const ctx = { ...local, family };
    expect(planAnswer("Gdzie pracuje Marta?", ctx)?.lines).toContain("Pracodawca matki — Studio Testowe.");
    expect(planAnswer("Kiedy urodziła się Ola?", ctx)?.lines.join(" ")).toContain("14 listopada 2026");
    for (const question of ["Gdzie pracuje Paweł?", "Gdzie pracuje tata Oli?"]) {
      expect(planAnswer(question, ctx)?.lines).toEqual(["Brakuje danych o pracodawcy ojca."]);
    }
    expect(planAnswer("Jaki jest mój tytuł ubezpieczenia?", ctx)?.lines).toEqual(["Tytuł ubezpieczenia matki — Umowa zlecenia."]);
    expect(planAnswer("Jaki jest status ubezpieczenia Pawła?", ctx)?.lines).toEqual(["Brakuje danych o ubezpieczeniu ojca."]);
    expect(planAnswer("Jaki jest status ubezpieczenia Oli?", ctx)?.lines).toEqual(["Brakuje potwierdzenia aktualnego ubezpieczenia dziecka."]);
    expect(planAnswer("Jaki jest status mojego ubezpieczenia?", ctx)?.caseIds).toBeUndefined();
  });

  it("explains the simulated import only when asked and leaves public citation follow-ups to retrieval", () => {
    const profile = planAnswer("Kiedy urodziła się Ola?", local);
    expect(profile?.lines.join(" ")).not.toMatch(/mObywatel|mZUS|import|źródł|przeglądar/);
    expect(planAnswer("Skąd pochodzą te dane?", local, profile ?? undefined)?.lines.join(" ")).toContain("Marty i Pawła Lisów");
    expect(planAnswer("Skąd masz moje dane?", local)?.lines.join(" ")).toContain("mObywatel i mZUS");
    expect(planAnswer("Podaj źródło", local)).toBeNull();
    expect(planAnswer("Z jakich źródeł wynika prawo do zasiłku?", local)).toBeNull();
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
    expect(sessionLeaveStatus({ ...view, submitted: true })).toContain("wcześniejszy wpis");
    expect(sessionLeaveStatus({ ...view, submitted: true, handoffRecordedByParent: true })).toContain("rodzic oznaczył samodzielne przekazanie pracodawcy");
    expect(sessionLeaveStatus({ ...view, childName: "Inna Rodzina" })).toBeNull();
    expect(sessionLeaveStatus(null)).toBeNull();
    expect(planAnswer("Jaki jest status urlopu rodzicielskiego?", local)?.readLeave).toBe(true);
  });
});
