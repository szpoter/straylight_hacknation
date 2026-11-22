import { describe, expect, it } from "vitest";
import { ZESTAW } from "@/lib/cases/zestaw";
import { loadCorpus } from "@/lib/rag/corpus-fs";
import { ELIGIBILITY_LAW_IDS, ageInYears, yearsGenitive, yearsLabel, assessMaternityEligibility, type EligibilityFacts } from "@/lib/rules/maternity-eligibility";

const TODAY = "2026-11-22";
const base: EligibilityFacts = { applicant: "rodzi", event: "porod", eventDate: "2026-03-10", title: "pracownik", insured: "tak" };
const check = (patch: Partial<EligibilityFacts>, today = TODAY) => assessMaternityEligibility({ ...base, ...patch }, today);

describe("prawo do zasiłku macierzyńskiego (art. 29, 30, 2a ustawy zasiłkowej)", () => {
  it("poród w okresie ubezpieczenia: przysługuje", () => {
    const r = check({});
    expect(r.status).toBe("przysluguje");
    expect(r.checkedOn).toBe("2026-03-10");
    expect(r.reasons.flatMap((x) => x.lawIds)).toContain("uz-29-1");
  });

  it("brak ubezpieczenia w dniu porodu: nie przysługuje", () => {
    expect(check({ insured: "nie", employmentEnd: "inna" }).status).toBe("nie-przysluguje");
  });

  it("nie wiadomo, czy było ubezpieczenie: pyta o fakt", () => {
    const r = check({ insured: "nie-wiem" });
    expect(r.status).toBe("brak-danych");
    expect(r.question).toContain("10.03.2026");
  });

  it("decyzja o niepodleganiu (umowa dla pozoru): nie przysługuje, z przypisem do Poradnika", () => {
    const r = check({ insured: "tak", notSubjectDecision: true });
    expect(r.status).toBe("nie-przysluguje");
    expect(r.reasons.flatMap((x) => x.lawIds)).toContain("poradnik-9-1");
    // Decyzja rozstrzyga także wtedy, gdy z akt nie odczytano daty porodu.
    expect(check({ eventDate: "", insured: "nie-wiem", notSubjectDecision: true }).status).toBe("nie-przysluguje");
  });

  it("upadłość lub likwidacja w ciąży: przysługuje, z zasiłkiem w wysokości zasiłku macierzyńskiego i wypłatą przez ZUS", () => {
    const r = check({ insured: "nie", employmentEnd: "upadlosc-likwidacja", employmentEndDate: "2025-12-31", otherEmployment: false });
    expect(r.status).toBe("przysluguje");
    expect(r.reasons.map((x) => x.text).join(" ")).toContain("zasiłek w wysokości zasiłku macierzyńskiego");
    expect(r.payerNote).toContain("ZUS");
    const other = check({ insured: "nie", employmentEnd: "smierc-pracodawcy", otherEmployment: true });
    expect(other.status).toBe("przysluguje");
    expect(other.reasons.map((x) => x.text).join(" ")).toContain("nie przysługuje");
  });

  it("rozwiązanie z naruszeniem prawa (wyrok) i umowa przedłużona do porodu: przysługuje", () => {
    expect(check({ insured: "nie", employmentEnd: "naruszenie-prawa-wyrok" }).status).toBe("przysluguje");
    expect(check({ insured: "nie", employmentEnd: "przedluzona-do-porodu" }).status).toBe("przysluguje");
    const sameDay = check({ insured: "tak", employmentEnd: "przedluzona-do-porodu" });
    expect(sameDay.status).toBe("przysluguje");
    expect(sameDay.reasons.flatMap((x) => x.lawIds)).toContain("uz-30-2");
  });

  it("wyjątki z art. 30 nie dotyczą zleceniobiorczyni", () => {
    expect(check({ title: "zleceniobiorca", insured: "nie", employmentEnd: "upadlosc-likwidacja" }).status).toBe("nie-przysluguje");
  });

  it("zlecenie bez dobrowolnego chorobowego: nie przysługuje, wyjaśnia dobrowolność", () => {
    const r = check({ title: "zleceniobiorca", insured: "nie" });
    expect(r.status).toBe("nie-przysluguje");
    expect(r.reasons.flatMap((x) => x.lawIds)).toContain("poradnik-10-1");
  });

  it("działalność: zadłużenie do progu nie przeszkadza, powyżej wstrzymuje, po 6 miesiącach przedawnia", () => {
    const firm = { title: "dzialalnosc" as const, eventDate: "2026-09-01" };
    // 1% płacy minimalnej 2026 (4806 zł) = 48,06 zł.
    expect(check({ ...firm, arrears: "nie-wiem" }).status).toBe("brak-danych");
    expect(check({ ...firm, arrears: "brak" }).status).toBe("przysluguje");
    expect(check({ ...firm, arrearsAmount: 48.06 }).status).toBe("przysluguje");
    expect(check({ ...firm, arrearsAmount: 48.07 }, "2026-10-01").status).toBe("wstrzymany");
    expect(check({ ...firm, arrearsAmount: 48.07, arrearsPaidOn: "2027-02-28" }).status).toBe("przysluguje");
    expect(check({ ...firm, arrearsAmount: 500 }, "2027-03-02").status).toBe("nie-przysluguje");
    expect(check({ ...firm, arrearsAmount: 500, arrearsPaidOn: "2027-03-15" }, "2027-04-01").status).toBe("nie-przysluguje");
    const ok = check({ ...firm, arrears: "brak" });
    expect(ok.payerNote).toContain("ZUS");
  });

  it("przysposobienie: do 14 lat i z wnioskiem do sądu", () => {
    const adopt = { event: "przysposobienie" as const, eventDate: "2026-01-26" };
    expect(check({ ...adopt, childBirthDate: "2012-01-27", courtFiled: "tak" }).status).toBe("przysluguje"); // 13 lat
    expect(check({ ...adopt, childBirthDate: "2012-01-26", courtFiled: "tak" }).status).toBe("nie-przysluguje"); // 14 lat
    expect(check({ ...adopt, childBirthDate: "2020-01-01", courtFiled: "nie" }).status).toBe("nie-przysluguje");
    expect(check({ ...adopt, childBirthDate: "2020-01-01", courtFiled: "nie-wiem" }).status).toBe("brak-danych");
    expect(check({ ...adopt }).status).toBe("brak-danych");
  });

  it("rodzina zastępcza: niezawodowa do 7 lat (10 przy odroczeniu), zawodowa bez prawa", () => {
    const foster = { event: "rodzina-zastepcza" as const, eventDate: "2026-05-01" };
    expect(check({ ...foster, childBirthDate: "2019-05-02" }).status).toBe("przysluguje"); // 6 lat
    expect(check({ ...foster, childBirthDate: "2019-05-01" }).status).toBe("nie-przysluguje"); // 7 lat
    expect(check({ ...foster, childBirthDate: "2017-01-01", schoolDeferred: true }).status).toBe("przysluguje"); // 9 lat
    expect(check({ event: "rodzina-zastepcza-zawodowa", eventDate: "2026-05-01", childBirthDate: "2025-01-01" }).status).toBe("nie-przysluguje");
  });

  it("drugi rodzic: sprawdza ubezpieczenie na początek swojego okresu, data porodu może być nieznana", () => {
    const r = check({ applicant: "drugi-rodzic", eventDate: "", periodStart: "2025-01-01" });
    expect(r.status).toBe("przysluguje");
    expect(r.checkedOn).toBe("2025-01-01");
    expect(r.reasons.flatMap((x) => x.lawIds)).toContain("uz-31-5");
  });

  it("odmiana lat", () => {
    expect([1, 2, 5, 12, 13, 22].map(yearsLabel)).toEqual(["1 rok", "2 lata", "5 lat", "12 lat", "13 lat", "22 lata"]);
    expect([1, 3, 13].map(yearsGenitive)).toEqual(["1 roku", "3 lat", "13 lat"]);
  });

  it("wiek dziecka w pełnych latach", () => {
    expect(ageInYears("2024-04-20", "2026-01-26")).toBe(1);
    expect(ageInYears("2012-01-26", "2026-01-26")).toBe(14);
    expect(ageInYears("2012-01-27", "2026-01-26")).toBe(13);
  });

  it("każdy przepis, na który powołuje się reguła, jest w korpusie", () => {
    const corpus = loadCorpus("publiczne");
    for (const id of ELIGIBILITY_LAW_IDS) expect(corpus.fragments.has(id), id).toBe(true);
  });
});

describe("zestaw spraw ZUS: wynik reguły zgodny z decyzją", () => {
  for (const c of ZESTAW) {
    it(`${c.id}: ${c.title}`, () => {
      const r = assessMaternityEligibility(c.facts, TODAY);
      expect(r.status).toBe(c.zus.status);
      expect(r.reasons.length).toBeGreaterThan(0);
    });
  }

  it("zestaw nie zawiera danych osobowych ani numerów", () => {
    const text = JSON.stringify(ZESTAW);
    expect(text).not.toMatch(/\d{11}/); // PESEL
    expect(text).not.toMatch(/\b(Krystyna|Ewa|Helena|Małgorzata|Joanna|Piotr|Zofia|Dariusz|Agnieszka)\b/);
  });
});
