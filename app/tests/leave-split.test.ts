import { describe, expect, it } from "vitest";
import { getPlan } from "@/lib/demo/fixtures";
import { buildPlans } from "@/lib/plan/build";
import {
  MAX_WEEKS_EACH,
  applySplit,
  canSplit,
  computeSplit,
  defaultInput,
  differenceSentence,
  formatPln,
  parentalStop,
  splitKey,
  suggestedStart,
} from "@/lib/plan/leave-split";

const TODAY = "2026-11-21";

describe("podział urlopu rodzicielskiego (reguła Juliana)", () => {
  it("podpowiedź startu: dzień po 20 tygodniach macierzyńskiego — zgodna z datą w planie Oli", () => {
    const ola = getPlan("ola");
    expect(ola.keyDate).toBeDefined();
    expect(suggestedStart(ola)).toBe("2027-03-30");
    expect(defaultInput(ola)).toEqual({ start: "2027-03-30", weeks: 4, rates: [140, 105] });
  });

  it("bliźnięta: 31 tygodni macierzyńskiego i jeden wspólny podział dla rodzeństwa", () => {
    const [a, b] = buildPlans({ situation: "urodzone", role: "urodzilam", date: "2026-11-01", childCount: "2", names: ["Ala", "Ola"], employment: "etat" }, "tw", TODAY);
    expect(suggestedStart(a)).toBe("2027-06-06"); // 1.11.2026 + 217 dni
    expect(splitKey(a)).toBe(splitKey(b));
  });

  it("oba warianty, terminy 21 dni przed startem i kwoty = stawka × dni", () => {
    const r = computeSplit({ start: "2027-03-30", weeks: 4, rates: [140, 105] }, "Ola");
    if (!r.ok) throw new Error(r.error);
    const { together, sequential } = r.view.variants;
    expect(together.first).toEqual({ from: "2027-03-30", to: "2027-04-26", deadline: "2027-03-09", amount: 3920 });
    expect(together.second.from).toBe("2027-03-30");
    expect(sequential.second).toEqual({ from: "2027-04-27", to: "2027-05-24", deadline: "2027-04-06", amount: 2940 });
    expect(together.calendarDays).toBe(28);
    expect(sequential.calendarDays).toBe(56);
    expect(together.total).toBe(6860);
    expect(differenceSentence(r.view)).toContain("o 28 dni dłużej");
  });

  it("„nie wiem” przy stawce: daty liczą się, kwota nie", () => {
    const r = computeSplit({ start: "2027-03-30", weeks: 2, rates: [140, null] }, "Ola");
    if (!r.ok) throw new Error(r.error);
    expect(r.view.variants.together.second.amount).toBeNull();
    expect(r.view.variants.together.total).toBeNull();
  });

  it("walidacja schematem Juliana: zła data, za długi urlop, ułamek grosza", () => {
    expect(computeSplit({ start: "", weeks: 4, rates: [140, 105] }, "Ola")).toEqual({ ok: false, error: "Podaj prawidłową datę rozpoczęcia." });
    expect(computeSplit({ start: "2027-03-30", weeks: MAX_WEEKS_EACH + 1, rates: [140, 105] }, "Ola").ok).toBe(false);
    expect(computeSplit({ start: "2027-03-30", weeks: MAX_WEEKS_EACH, rates: [140, 105] }, "Ola").ok).toBe(true);
    expect(computeSplit({ start: "2027-03-30", weeks: 4, rates: [140.005, 105] }, "Ola").ok).toBe(false);
    expect(computeSplit({ start: "2027-03-30", weeks: 4, rates: [123.45, 99.99] }, "Ola").ok).toBe(true);
  });

  it("imię planu ze znakami spoza schematu nie psuje liczenia", () => {
    expect(computeSplit({ start: "2027-03-30", weeks: 4, rates: [140, 105] }, "Sprawa testowa · Alicja T.").ok).toBe(true);
    expect(computeSplit({ start: "2027-03-30", weeks: 4, rates: [140, 105] }, "🙂").ok).toBe(true);
  });

  it("wybrany wariant trafia na przystanek: termin, warunek i notatka ze źródłem", () => {
    const ola = getPlan("ola");
    const seq = applySplit(ola, { start: "2027-03-30", weeks: 4, rates: [140, 105], variant: "sequential" });
    const stop = parentalStop(seq)!;
    expect(stop.due).toBe("2027-03-09");
    expect(stop.condition).toBe("Od 30 marca 2027 · wariant „Po kolei”");
    expect(stop.notes?.at(-1)?.text).toContain("drugi rodzic od 27 kwietnia 2027");
    expect(stop.notes?.at(-1)?.sources[0].url).toBe("https://www.gov.pl/web/rodzina/urlop-rodzicielski");
    expect(stop.doc?.note).toBe("Wniosek do 9 marca 2027");
    // Bez wyboru i przy błędnych danych plan zostaje bez zmian.
    expect(applySplit(ola, undefined)).toBe(ola);
    expect(applySplit(ola, { start: "x", weeks: 4, rates: [1, 1], variant: "together" })).toBe(ola);
  });

  it("podział tylko tam, gdzie jest przystanek i data", () => {
    expect(canSplit(getPlan("ola"))).toBe(true);
    const [planning] = buildPlans({ situation: "planuje", role: "rodzic", employment: "etat" }, "pl", TODAY);
    expect(canSplit(planning)).toBe(false);
  });

  it("kwoty z groszami", () => {
    expect(formatPln(6860)).toBe("6 860,00 zł");
    expect(formatPln(3456.6)).toBe("3 456,60 zł");
  });
});
