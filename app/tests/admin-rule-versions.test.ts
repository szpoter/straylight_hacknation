import { describe, expect, it } from "vitest";
import { appParameters, paternityTestCases } from "@/lib/admin/catalog";
import { checkPaternityLimit, checksPassed, checksSummary } from "@/lib/admin/change-checks";
import {
  EMPTY_STATE,
  MAX_VERSIONS,
  decodeState,
  encodeState,
  labelOf,
  publishDraft,
  saveDraft,
  scheduleOf,
  withdrawScheduled,
  type RuleVersionsState,
} from "@/lib/admin/rule-versions";
import { validateValue, valueOn, weeksLabel } from "@/lib/rules/parameters";
import { evaluatePaternity, type PaternityInput } from "@/lib/rules/paternity";

const SECRET = "test-secret-not-real";
const NOW = "2026-11-21T10:00:00.000Z";
const TODAY = "2026-11-21";

const draftInput = (value: number, validFrom = "2027-01-01") => ({
  parameter: "paternity.totalDays" as const,
  value,
  validFrom,
  reason: "Symulacja zmiany ustawy",
  source: "Projekt ustawy, art. 1",
});
const meta = (id: string) => ({ id, now: NOW, author: "admin", fallback: 14 });

function published(value: number, validFrom = "2027-01-01"): RuleVersionsState {
  const draft = saveDraft(EMPTY_STATE, draftInput(value, validFrom), meta("v1"));
  if (!draft.ok) throw new Error(draft.error);
  const done = publishDraft(draft.state, { draftId: "v1", expectedRevision: draft.state.revision, checks: "6 / 6 zgodnych" }, NOW);
  if (!done.ok) throw new Error(done.error);
  return done.state;
}

describe("rule parameters", () => {
  it("picks the latest value that has started, else the default", () => {
    const schedule = { "paternity.totalDays": [{ value: 21, validFrom: "2027-01-01" }, { value: 7, validFrom: "2027-06-01" }] };
    expect(valueOn(schedule, "paternity.totalDays", "2026-12-31", 14)).toEqual({ value: 14, validFrom: null });
    expect(valueOn(schedule, "paternity.totalDays", "2027-01-01", 14).value).toBe(21);
    expect(valueOn(schedule, "paternity.totalDays", "2027-06-02", 14).value).toBe(7);
  });

  it("accepts whole weeks from 1 to 4 only", () => {
    expect(validateValue("paternity.totalDays", 21)).toEqual([]);
    expect(validateValue("paternity.totalDays", 10)).not.toEqual([]);
    expect(validateValue("paternity.totalDays", 35)).not.toEqual([]);
    expect(weeksLabel(14)).toBe("2 tygodnie");
    expect(weeksLabel(7)).toBe("1 tydzień");
  });
});

describe("paternity rule with a published limit", () => {
  const kamil: PaternityInput = {
    childBirthDate: "2026-11-01",
    insuranceConfirmed: true,
    noArrears: true,
    priorParts: [{ start: "2026-11-10", end: "2026-11-23" }],
    request: { start: "2027-01-11", days: 7 },
    today: "2026-12-01",
  };

  it("uses the value valid on the first day of the requested period", () => {
    expect(evaluatePaternity(kamil).status).toBe("not_eligible");
    const schedule = scheduleOf(published(21));
    const after = evaluatePaternity({ ...kamil, schedule });
    expect(after.status).toBe("eligible");
    expect(after.partNumber).toBe(2);
    // A period starting before the change keeps the old limit.
    expect(evaluatePaternity({ ...kamil, schedule, request: { start: "2026-12-28", days: 7 } }).status).toBe("not_eligible");
  });

  it("explains the limit in weeks", () => {
    const r = evaluatePaternity({ ...kamil, schedule: scheduleOf(published(7)) });
    expect(r.reasons.at(-1)?.text).toContain("1 tydzień");
  });
});

describe("rule versions", () => {
  it("saving twice keeps one draft per parameter", () => {
    const a = saveDraft(EMPTY_STATE, draftInput(21), meta("d1"));
    if (!a.ok) throw new Error(a.error);
    const b = saveDraft(a.state, draftInput(28), meta("d2"));
    if (!b.ok) throw new Error(b.error);
    expect(b.state.versions).toHaveLength(1);
    expect(b.state.versions[0]).toMatchObject({ id: "d1", value: 28, status: "draft", previousValue: 14 });
  });

  it("rejects a date that is not in the future and a value outside the range", () => {
    expect(saveDraft(EMPTY_STATE, draftInput(21, TODAY), meta("x")).ok).toBe(false);
    expect(saveDraft(EMPTY_STATE, draftInput(10), meta("x")).ok).toBe(false);
  });

  it("publishes once even when repeated, and detects a conflicting revision", () => {
    const draft = saveDraft(EMPTY_STATE, draftInput(21), meta("v1"));
    if (!draft.ok) throw new Error(draft.error);
    const request = { draftId: "v1", expectedRevision: draft.state.revision, checks: "6 / 6 zgodnych" };
    const first = publishDraft(draft.state, request, NOW);
    if (!first.ok) throw new Error(first.error);
    const again = publishDraft(first.state, request, NOW);
    expect(again.ok && again.state).toBe(first.state);

    const other = saveDraft(first.state, draftInput(7, "2027-03-01"), meta("v2"));
    if (!other.ok) throw new Error(other.error);
    const stale = publishDraft(other.state, { draftId: "v2", expectedRevision: draft.state.revision, checks: "" }, NOW);
    expect(stale.ok).toBe(false);
  });

  it("labels versions and withdraws only scheduled ones", () => {
    const state = published(21);
    const version = state.versions[0];
    expect(labelOf(version, state, TODAY)).toBe("Zaplanowana");
    expect(labelOf(version, state, "2027-01-01")).toBe("Obowiązuje");
    const withdrawn = withdrawScheduled(state, version.id, TODAY);
    expect(withdrawn.ok && scheduleOf(withdrawn.state)).toEqual({});
    expect(withdrawScheduled(state, version.id, "2027-01-02").ok).toBe(false);
  });

  it("round-trips through the signed cookie and rejects tampering", () => {
    const state = published(21);
    const raw = encodeState(state, SECRET);
    expect(decodeState(raw, SECRET)).toEqual(state);
    expect(decodeState(raw, "other-secret")).toEqual(EMPTY_STATE);
    expect(decodeState(raw.slice(0, -3) + "abc", SECRET)).toEqual(EMPTY_STATE);
    expect(decodeState("garbage", SECRET)).toEqual(EMPTY_STATE);
  });

  it("keeps the cookie small by capping the number of versions", () => {
    let state: RuleVersionsState = EMPTY_STATE;
    for (let i = 0; i < MAX_VERSIONS + 5; i++) {
      const month = String((i % 12) + 1).padStart(2, "0");
      const d = saveDraft(state, draftInput(i % 2 ? 21 : 7, `2028-${month}-0${(i % 9) + 1}`), meta(`d${i}`));
      if (!d.ok) throw new Error(d.error);
      const p = publishDraft(d.state, { draftId: `d${i}`, expectedRevision: d.state.revision, checks: "ok" }, NOW);
      if (!p.ok) throw new Error(p.error);
      state = p.state;
    }
    expect(state.versions.length).toBeLessThanOrEqual(MAX_VERSIONS);
    expect(encodeState(state, SECRET).length).toBeLessThan(3800);
  });
});

describe("Sprawdź zmianę for the paternity limit", () => {
  for (const limit of [7, 21, 28]) {
    it(`a change to ${limit} days passes every boundary check`, () => {
      const rows = checkPaternityLimit({}, { value: limit, validFrom: "2027-01-01", source: "art. 1" });
      expect(rows.filter((r) => r.status === "niezgodna")).toEqual([]);
      expect(checksPassed(rows)).toBe(true);
    });
  }

  it("test cases before the change keep their result", () => {
    const rows = checkPaternityLimit({}, { value: 7, validFrom: "2027-06-01", source: "art. 1" });
    const regression = rows.find((r) => r.name.startsWith("Sprawy testowe sprzed daty zmiany"));
    expect(regression).toMatchObject({ status: "zgodna", result: "wynik bez zmian" });
  });

  it("cases inside the change are reported, not failed", () => {
    const rows = checkPaternityLimit({}, { value: 7, validFrom: "2026-12-01", source: "art. 1" });
    const info = rows.filter((r) => r.status === "informacja");
    expect(info.map((r) => r.name.slice(0, 4))).toContain("K-02");
    expect(checksPassed(rows)).toBe(true);
    expect(checksSummary(rows)).toMatch(/^\d+ \/ \d+ zgodnych$/);
  });

  it("a missing source fails the check", () => {
    const rows = checkPaternityLimit({}, { value: 21, validFrom: "2027-01-01", source: " " });
    expect(checksPassed(rows)).toBe(false);
  });
});

describe("catalogue after publication", () => {
  it("shows the scheduled value next to the current one, and later as current", () => {
    const state = published(21);
    const before = appParameters(state, TODAY).find((p) => p.id === "app-paternity-total");
    expect(before).toMatchObject({ value: "14 dni", planned: { value: "21 dni", from: "2027-01-01" }, editable: true });
    const after = appParameters(state, "2027-01-02").find((p) => p.id === "app-paternity-total");
    expect(after).toMatchObject({ value: "21 dni", from: "2027-01-01" });
    expect(after?.history[0]).toMatchObject({ value: "21 dni", state: "Obowiązuje" });
  });

  it("test cases are evaluated with the published schedule", () => {
    const k07 = (schedule = {}) => paternityTestCases(schedule).find((c) => c.id === "K-07");
    expect(k07()?.status).toBe("zgodna");
    const changed = k07(scheduleOf(published(21, "2026-12-01")));
    expect(changed?.status).toBe("niezgodna");
    expect(changed?.result[0]).toEqual({ label: "Wynik", value: "przysługuje" });
  });
});
