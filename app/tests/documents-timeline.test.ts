import { describe, expect, it } from "vitest";
import { getPlan } from "@/lib/demo/fixtures";
import { buildTimeline } from "@/features/documents/timeline";
import { childFiles, rowAction, sortCases, type DocCase } from "@/features/documents/model";
import { docCases } from "@/lib/plan/docs";

const find = (planId: string, id: string) => getPlan(planId).stops.find((s) => s.id === id)!;

describe("przebieg sprawy", () => {
  it("po potwierdzeniu wpływu bieżący jest etap 3 z „Oczekujemy na wiadomość”", () => {
    const t = buildTimeline(find("ola", "800plus"));
    expect(t.map((s) => s.status)).toEqual(["done", "done", "current", "future"]);
    expect(t[1].date).toBe("2026-11-15");
    expect(t[2].detail).toBe("Oczekujemy na wiadomość");
  });

  it("bez UPP bieżący jest etap 2 „Oczekujemy na potwierdzenie”", () => {
    const t = buildTimeline(find("ola", "urlop-macierzynski"));
    expect(t.map((s) => s.status)).toEqual(["done", "current", "future", "future"]);
    expect(t[1].detail).toBe("Oczekujemy na potwierdzenie");
  });

  it("wezwanie jest wpisem pod etapem 3", () => {
    const t = buildTimeline(find("test-alicja", "800plus"));
    expect(t[2].status).toBe("current");
    expect(t[2].entries.map((e) => e.title)).toEqual(["Otrzymano wezwanie"]);
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
  it("szkic z Zusikiem", () => {
    expect(rowAction(cases.find((c) => c.id === "urlop-ojcowski")!)).toEqual({ label: "Dokończ z Zusikiem", kind: "zusik" });
  });
  it("pliki dziecka: kopia, UPP i pismo", () => {
    const types = childFiles(cases).map((f) => f.type);
    expect(types).toContain("Pismo przychodzące");
    expect(types).toContain("Potwierdzenie");
    expect(types).toContain("Kopia wniosku");
  });
});
