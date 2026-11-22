import { describe, expect, it } from "vitest";
import { getPlan } from "@/lib/demo/fixtures";
import { buildTimeline } from "@/features/documents/timeline";
import { childFiles, rowAction, sortCases, type DocCase } from "@/features/documents/model";
import { docCases } from "@/lib/plan/docs";

const find = (planId: string, id: string) => getPlan(planId).stops.find((s) => s.id === id)!;

describe("przebieg sprawy", () => {
  it("historyczny wpis nie potwierdza urzędowego wpływu", () => {
    const t = buildTimeline(find("ola", "800plus"));
    expect(t.map((s) => s.status)).toEqual(["done", "current", "future", "future"]);
    expect(t[1].date).toBeUndefined();
    expect(t[2].entries).toContainEqual({ date: "2026-11-15", title: "Wcześniejszy wpis planu o wpływie" });
  });

  it("bez UPP bieżący jest etap 2 „Oczekujemy na potwierdzenie”", () => {
    const t = buildTimeline({ ...find("ola", "urlop-ojcowski"), state: "wyslano", doc: {
      goal: "urlopy", recipient: "Do pracodawcy", events: [{ date: "2026-11-22", title: "Rodzic oznaczył przekazanie" }],
    } });
    expect(t.map((s) => s.status)).toEqual(["done", "current", "future", "future"]);
    expect(t[1].detail).toBe("Sprawdź potwierdzenie u odbiorcy.");
  });

  it("po porodzie plan nie przypisuje matce historycznej wysyłki wniosku urlopowego", () => {
    expect(docCases(getPlan("ola").stops).map(stop => stop.id)).not.toContain("urlop-macierzynski");
  });

  it("wezwanie jest wpisem pod etapem 3", () => {
    const t = buildTimeline(find("test-alicja", "800plus"));
    expect(t[2].status).toBe("current");
    expect(t[2].entries.map((e) => e.title)).toContain("Otrzymano wezwanie");
  });

  it("sprawa z wynikiem ma wszystkie etapy zakończone", () => {
    const t = buildTimeline(find("ola", "chorobowy-ciaza"));
    expect(t.every((s) => s.status === "done")).toBe(true);
    expect(t[3].detail).toBe("Świadczenie wypłacone");
  });

  it("sprawa niewysłana nie ma bieżącego etapu", () => {
    expect(buildTimeline(find("ola", "zglos-urodzenie")).every((s) => s.status === "future")).toBe(true);
  });
});

describe("wiersz i pliki", () => {
  const cases = docCases(getPlan("test-alicja").stops) as DocCase[];
  it("wezwanie na górze i z akcją „Otwórz wezwanie”", () => {
    const sorted = sortCases(cases);
    expect(sorted[0].id).toBe("800plus");
    expect(rowAction(sorted[0]).label).toBe("Otwórz wezwanie");
  });
  it("szkic prowadzi do wniosku do samodzielnej edycji", () => {
    expect(rowAction(cases.find((c) => c.id === "urlop-ojcowski")!)).toEqual({ label: "Uzupełnij wniosek", kind: "link", step: "wniosek" });
  });
  it("historyczne wpisy nie tworzą plików UPP ani kopii", () => {
    const types = childFiles(cases).map((f) => f.type);
    expect(types).toContain("Pismo przychodzące");
    expect(types).not.toContain("Potwierdzenie");
    expect(types).not.toContain("Kopia wniosku");
  });
});
