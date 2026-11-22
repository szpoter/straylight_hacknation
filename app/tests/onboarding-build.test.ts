import { describe, expect, it } from "vitest";
import { buildPlan, buildPlans, declineName, employmentRisk, leaveWeeks, planHighlights, refreshSavedLeavePlan, shiftTextDates } from "@/lib/plan/build";
import { STOP_DETAILS } from "@/lib/demo/stop-details";
import { isResolved } from "@/lib/plan/status";

describe("plan z onboardingu", () => {
  it("przesuwa terminy do daty urodzenia i zmienia imię", () => {
    const plan = buildPlan({ situation: "urodzone", role: "urodzilam", date: "2026-11-15", name: "Maja" }, "p1");
    const zgl = plan.stops.find((s) => s.id === "zglos-urodzenie")!;
    expect(zgl.due).toBe("2026-12-06"); // 21 dni od 15.11
    expect(zgl.title).toBe("Zgłoś urodzenie Mai");
    expect(plan.stops.find((s) => s.id === "ubezpieczenie-dziecka")!.title).toBe("Zgłoś Maję do ubezpieczenia zdrowotnego");
    expect(plan.keyDate).toBe("2026-11-15");
    expect(plan.stage).toBe("narodziny");
    // Etapy sprzed porodu zostają na ścieżce jako „Za Tobą”, pionek stoi na narodzinach.
    const past = plan.stops.filter((s) => s.stage === "ciaza" || s.stage === "przed");
    expect(past.length).toBeGreaterThan(0);
    expect(past.every((s) => s.state === "minelo" && !s.due)).toBe(true);
    expect(plan.stops.find((s) => s.id === "800plus")!.due).toBe("2027-02-15");
  });

  it("bez imienia mówi o dziecku", () => {
    const plan = buildPlan({ situation: "urodzone", role: "urodzilam", date: "2026-11-10" }, "p2");
    expect(plan.name).toBe("Dziecko");
    expect(plan.stops.find((s) => s.id === "zglos-urodzenie")!.title).toBe("Zgłoś urodzenie dziecka");
  });

  it("plan oczekiwanego dziecka liczy od terminu porodu", () => {
    const plan = buildPlan({ situation: "ciaza", role: "w-ciazy", date: "2027-06-14" }, "p3");
    expect(plan.stage).toBe("ciaza");
    expect(plan.stops.find((s) => s.id === "e-zaplanuj-urlopy")!.due).toBe("2027-07-05");
    expect(plan.stops.find((s) => s.id === "e-macierzynski-przed")!.dueBasis).toContain("3 maja 2027");
    expect(plan.shortInfo).toBe("czerwiec 2027");
  });

  it("odświeża zapisane plany także bez odpowiedzi onboardingowych i zachowuje szkice urlopowe", () => {
    const current = buildPlan({ situation: "urodzone", date: "2026-11-15", name: "Maja", employment: "etat" }, "stary");
    const stops = current.stops.filter(s => s.id !== "rodzicielski-praca").map(s => {
      if (s.id === "urlop-macierzynski") return { ...s, kind: "na-wniosek" as const, doc: { goal: "urlopy" as const, recipient: "Kadry" } };
      if (s.id === "urlop-ojcowski") return { ...s, state: "szkic" as const, doc: { ...s.doc!, hasDraft: true, note: "Moje dane" } };
      return s;
    });
    for (const origin of [current.origin, undefined]) {
      const plan = refreshSavedLeavePlan({ ...current, origin, stops });
      expect(plan.stops.find(s => s.id === "urlop-macierzynski")?.doc).toBeUndefined();
      expect(plan.stops.find(s => s.id === "rodzicielski-praca")?.doc).toBeDefined();
      expect(plan.stops.find(s => s.id === "urlop-ojcowski")?.doc?.note).toBe("Moje dane");
      expect(plan.stops.find(s => s.id === "800plus")).toBe(stops.find(s => s.id === "800plus"));
      expect(refreshSavedLeavePlan(plan)).toBe(plan);
    }
  });

  it("drugi rodzic nie widzi spraw osoby, która rodzi", () => {
    const plan = buildPlan({ situation: "urodzone", role: "drugi-rodzic", date: "2026-11-10" }, "p4");
    const ids = plan.stops.map((s) => s.id);
    expect(ids).not.toContain("zasilek-macierzynski");
    expect(ids).not.toContain("urlop-macierzynski");
    expect(plan.stops.find((s) => s.id === "urlop-ojcowski")!.forWhom).toBe("Dla Ciebie");
    expect(plan.stops.find((s) => s.id === "zglos-urodzenie")!.parallelWith).toBeUndefined();
  });

  it("zmiana pracy dodaje ostrzeżenie", () => {
    const plan = buildPlan({ situation: "urodzone", role: "urodzilam", date: "2026-11-10", jobChange: "tak" }, "p5");
    expect(plan.stops.find((s) => s.id === "zasilek-macierzynski")!.risk?.title).toBe("Zmiana pracy lub koniec umowy");
    expect(planHighlights(plan).warnings).toBe(1);
    const none = buildPlan({ situation: "urodzone", role: "urodzilam", date: "2026-11-10", jobChange: "nie" }, "p6");
    expect(none.stops.some((s) => s.risk)).toBe(false);
  });

  it("ciąża: ryzyka, zasiłek po upadłości pracodawcy i świadczenie rehabilitacyjne (zadanie s. 12–13, pkt a i h)", () => {
    const ids = (answers: Parameters<typeof buildPlan>[0]) => buildPlan(answers, "r").stops.map((s) => s.id);
    const pregnant = ids({ situation: "ciaza", role: "w-ciazy", date: "2027-05-14", employment: "etat" });
    expect(pregnant).toEqual(expect.arrayContaining(["e-ryzyka", "e-zasilek-likwidacja", "e-swiadczenie-rehabilitacyjne"]));
    // Art. 30 ust. 3 ustawy zasiłkowej: tylko pracownice.
    expect(ids({ situation: "ciaza", role: "w-ciazy", date: "2027-05-14", employment: "dzialalnosc" })).not.toContain("e-zasilek-likwidacja");
    // Drugi rodzic: bez spraw osoby w ciąży, ale z ryzykami.
    const second = ids({ situation: "ciaza", role: "drugi-rodzic", date: "2027-05-14" });
    expect(second).toContain("e-ryzyka");
    expect(second).not.toContain("e-zasilek-likwidacja");
    expect(second).not.toContain("e-swiadczenie-rehabilitacyjne");
    // Adopcja: bez etapu ciąży.
    expect(ids({ situation: "adopcja", role: "urodzilam", date: "2026-11-10" }).some((id) => id.includes("likwidacja") || id.includes("rehabilitacyjne"))).toBe(false);
  });

  it("nowe opisy przystanków mają źródła i są zgodne z ustawą", () => {
    for (const id of ["ryzyka", "zasilek-likwidacja", "swiadczenie-rehabilitacyjne"]) {
      const d = STOP_DETAILS[id];
      expect(d.paragraphs.length).toBeGreaterThan(2);
      expect(d.sources.length).toBeGreaterThan(0);
      expect(d.sources.every((s) => s.url.startsWith("https://"))).toBe(true);
      expect(new Set(d.sources.map((s) => s.url)).size).toBe(d.sources.length);
    }
    // Art. 19 ust. 1: 90% / 75%, w ciąży 100%.
    expect(STOP_DETAILS["swiadczenie-rehabilitacyjne"].paragraphs.join(" ")).toMatch(/90%.*75%.*100%/);
  });

  it("działalność i inna umowa: ostrzeżenie o dobrowolnym ubezpieczeniu chorobowym", () => {
    const firm = buildPlan({ situation: "urodzone", role: "urodzilam", date: "2026-11-10", employment: "dzialalnosc" }, "f");
    const risk = firm.stops.find((s) => s.id === "zasilek-macierzynski")!.risk!;
    expect(risk.title).toBe("Dobrowolne ubezpieczenie chorobowe i składki");
    expect(risk.detail).toContain("1% minimalnego wynagrodzenia");
    expect(risk.sources?.length).toBe(2);
    const other = buildPlan({ situation: "urodzone", role: "urodzilam", date: "2026-11-10", employment: "inne" }, "o");
    expect(other.stops.find((s) => s.id === "zasilek-macierzynski")!.risk?.title).toBe("Inna umowa: sprawdź ubezpieczenie chorobowe");
    // Zmiana pracy ma pierwszeństwo na tej samej sprawie.
    const both = buildPlan({ situation: "urodzone", role: "urodzilam", date: "2026-11-10", employment: "dzialalnosc", jobChange: "tak" }, "b");
    expect(both.stops.find((s) => s.id === "zasilek-macierzynski")!.risk?.title).toBe("Zmiana pracy lub koniec umowy");
    expect(employmentRisk("etat")).toBeUndefined();
  });

  it("nic nie jest za rodzicem poza sprawami, które dzieją się same", () => {
    for (const situation of ["urodzone", "ciaza", "planuje", "adopcja"] as const) {
      const plan = buildPlan({ situation, role: "urodzilam", date: situation === "ciaza" ? "2027-05-14" : "2026-11-10" }, "p");
      const resolved = plan.stops.filter((s) => isResolved(s) && s.state !== "minelo");
      expect(resolved.every((s) => s.kind === "dzieje-sie-samo")).toBe(true);
    }
  });

  it("podaje liczby na ekran gotowego planu", () => {
    const h = planHighlights(buildPlan({ situation: "urodzone", role: "urodzilam", date: "2026-11-10" }, "p7"));
    expect(h.total).toBeGreaterThan(5);
    expect(h.nearest?.id).toBe("zglos-urodzenie");
    expect(h.stages).toBe(2);
  });

  it("bliźnięta: osobny plan na dziecko, wspólne sprawy rodzica w obu planach — ścieżki takie same", () => {
    const plans = buildPlans({ situation: "urodzone", role: "urodzilam", date: "2026-11-10", childCount: "2", names: ["Bartek", "Julek"] }, "bl");
    expect(plans.map((p) => p.name)).toEqual(["Bartek", "Julek"]);
    const [b, j] = plans;
    // Te same sprawy w tej samej kolejności → pionek na tym samym miejscu.
    expect(b.stops.map((s) => s.id)).toEqual(j.stops.map((s) => s.id));
    const shared = b.stops.find((s) => s.id === "zasilek-macierzynski")!;
    expect(shared.sharedGroup).toBe("bl");
    expect(j.stops.find((s) => s.id === "800plus")!.sharedGroup).toBeUndefined(); // 800+ na każde dziecko
    expect(j.stops.find((s) => s.id === "zglos-urodzenie")!.title).toBe("Zgłoś urodzenie Julka");
  });

  it("dopisane zdania o przepisach zawsze mają źródło", () => {
    const plans = buildPlans({ situation: "urodzone", role: "urodzilam", date: "2026-11-10", childCount: "2", employment: "nie-pracuje", jobChange: "tak" }, "s");
    const stops = plans.flatMap((p) => p.stops);
    const notes = stops.flatMap((s) => s.notes ?? []);
    expect(notes.length).toBeGreaterThan(0);
    expect(notes.every((n) => n.sources.length > 0)).toBe(true);
    expect(notes.some((n) => n.text.includes("31 tygodni"))).toBe(true);
    expect(stops.filter((s) => s.risk).every((s) => (s.risk!.sources ?? []).length > 0)).toBe(true);
    expect(leaveWeeks(2)).toEqual({ maternity: 31, parental: 43 });
    expect(leaveWeeks(5).maternity).toBe(37);
  });

  it("ciąża z bliźniętami: jeden plan bez imion", () => {
    const plans = buildPlans({ situation: "ciaza", role: "w-ciazy", date: "2027-05-14", childCount: "2" }, "c");
    expect(plans).toHaveLength(1);
    expect(plans[0].name).toBe("Oczekiwane bliźnięta");
  });

  it("pomocnicze: odmiana i daty w tekście", () => {
    expect(declineName("Antek")).toEqual({ nom: "Antek", gen: "Antka", acc: "Antka" });
    expect(declineName("Ola")).toEqual({ nom: "Ola", gen: "Oli", acc: "Olę" });
    expect(declineName("Jan").gen).toBe("Jana");
    expect(shiftTextDates("od 30 marca 2027", 2)).toBe("od 1 kwietnia 2027");
  });
});
