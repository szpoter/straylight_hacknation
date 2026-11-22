import { describe, expect, it } from "vitest";
import { daysLeftLabel, formatMoney, todayInPoland } from "@/lib/demo/dates";
import { getPlan } from "@/lib/demo/fixtures";
import type { Stop } from "@/lib/demo/types";
import { nearestStop, openCountInStage, pawnRowIndex, toRows } from "@/lib/plan/path";
import { docStatus, pathStatus } from "@/lib/plan/status";

const base = { institution: "X", forWhom: "Y", why: "Z", source: { label: "s", url: "https://example.org" }, action: { label: "a" } };
const stop = (over: Partial<Stop> & Pick<Stop, "id" | "kind">): Stop => ({ stage: "narodziny", title: over.id, ...base, ...over });

describe("pionek na ścieżce", () => {
  it("stoi na pierwszym rzędzie z czymś do zrobienia (plan Oli: Zgłoś urodzenie i zasiłek)", () => {
    const rows = toRows(getPlan("ola").stops);
    const row = rows[pawnRowIndex(rows)];
    expect(row.stops.map((s) => s.id)).toEqual(["zglos-urodzenie", "zasilek-macierzynski"]);
  });

  it("odhaczenie informacji przed pionkiem przesuwa go o pole", () => {
    const stops = [stop({ id: "info", kind: "informacja" }), stop({ id: "duty", kind: "obowiazek", state: "aktualna" })];
    expect(pawnRowIndex(toRows(stops))).toBe(0);
    stops[0] = { ...stops[0], checked: true };
    expect(pawnRowIndex(toRows(stops))).toBe(1);
  });

  it("sprawa załatwiona za niezałatwionym obowiązkiem nie przesuwa pionka", () => {
    const stops = [stop({ id: "duty", kind: "obowiazek", state: "aktualna" }), stop({ id: "later", kind: "na-wniosek", state: "zalatwione" })];
    expect(pawnRowIndex(toRows(stops))).toBe(0);
  });

  it("rząd równoległy przepuszcza pionka dopiero po obu sprawach", () => {
    const stops = [
      stop({ id: "a", kind: "obowiazek", state: "zalatwione", parallelWith: "b" }),
      stop({ id: "b", kind: "na-wniosek", state: "szkic", parallelWith: "a" }),
      stop({ id: "c", kind: "obowiazek", state: "aktualna" }),
    ];
    const rows = toRows(stops);
    expect(rows).toHaveLength(2);
    expect(pawnRowIndex(rows)).toBe(0);
  });

  it("gdy wszystko załatwione, stoi na ostatnim polu", () => {
    const stops = [stop({ id: "a", kind: "obowiazek", state: "zalatwione" }), stop({ id: "b", kind: "na-wniosek", state: "nie-korzystam" })];
    expect(pawnRowIndex(toRows(stops))).toBe(1);
  });
});

describe("najbliższa sprawa", () => {
  it("plan Oli: obowiązek z najbliższym terminem", () => {
    expect(nearestStop(getPlan("ola").stops)?.id).toBe("zglos-urodzenie");
  });
  it("wezwanie ma pierwszeństwo", () => {
    expect(nearestStop(getPlan("test-alicja").stops)?.id).toBe("800plus");
  });
  it("licznik etapu pomija wysłane i przyszłe", () => {
    expect(openCountInStage(getPlan("ola").stops, "narodziny")).toBe(3);
  });
});

describe("statusy i formaty", () => {
  it("jeden stan, dwa poziomy prezentacji", () => {
    expect(pathStatus(stop({ id: "x", kind: "na-wniosek", state: "szkic" }))).toBe("W trakcie");
    expect(docStatus("wezwanie")).toEqual({ group: "do-zalatwienia", label: "Do uzupełnienia po wezwaniu" });
    expect(docStatus("warunek").group).toBe("na-pozniej");
  });
  it("liczy dni do terminu i formatuje kwoty", () => {
    expect(todayInPoland(new Date("2026-11-21T23:30:00Z"))).toBe("2026-11-22");
    expect(daysLeftLabel("2026-12-01", "2026-11-21")).toBe("zostało 10 dni");
    expect(formatMoney(3920)).toBe("3\u00a0920\u00a0zł");
    expect(formatMoney(6860)).toBe("6\u00a0860\u00a0zł");
  });
});

describe("plan oczekiwanego dziecka", () => {
  it("ma ten sam katalog przystanków co plan Oli (plus ostrzeżenie o umowie)", () => {
    expect(getPlan("oczekiwane").stops).toHaveLength(getPlan("ola").stops.length + 1);
  });
  it("pionek stoi w ciąży, najbliższa sprawa to plan urlopów", () => {
    const rows = toRows(getPlan("oczekiwane").stops);
    expect(rows[pawnRowIndex(rows)].stage).toBe("ciaza");
    expect(nearestStop(getPlan("oczekiwane").stops)?.id).toBe("e-zaplanuj-urlopy");
  });
});
