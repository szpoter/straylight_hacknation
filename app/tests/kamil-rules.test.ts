import { describe, expect, it } from "vitest";
import { CITATIONS } from "@/lib/kamil/sources";
import { addDays, addMonths, formatRange } from "@/lib/rules/dates";
import { evaluatePaternity, type PaternityInput } from "@/lib/rules/paternity";

/** Kamil's profile from TECH-SPEC-AGENT.md, scenario 2. */
const KAMIL: PaternityInput = {
  childBirthDate: "2026-05-20",
  insuranceConfirmed: true,
  noArrears: true,
  priorParts: [],
  request: { start: "2026-12-08", days: 7 },
  today: "2026-11-21",
};

describe("dates", () => {
  it("adds months and days on calendar dates", () => {
    expect(addMonths("2026-05-20", 12)).toBe("2027-05-20");
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addDays("2026-12-08", -1)).toBe("2026-12-07");
    expect(formatRange("2026-12-08", "2026-12-14")).toBe("8–14 grudnia 2026 r.");
  });
});

describe("paternity rule · Kamil", () => {
  it("first week from 8 December: 8–14.12.2026, part 1, ZAM by 7.12.2026", () => {
    const r = evaluatePaternity(KAMIL);
    expect(r.status).toBe("eligible");
    expect(r.period).toEqual({ start: "2026-12-08", end: "2026-12-14", days: 7 });
    expect(r.partNumber).toBe(1);
    expect(r.deadline).toBe("2026-12-07");
    expect(r.deadlinePassed).toBe(false);
    expect(r.daysLeftAfter).toBe(7);
    expect(r.lastAllowedDay).toBe("2027-05-19");
  });

  it("attaches the official fragment for every reason it relies on", () => {
    const r = evaluatePaternity(KAMIL);
    expect(r.citationIds).toEqual(
      expect.arrayContaining(["zam-info-prawo", "zam-info-okres", "zus-termin-niepracownik", "zus-ojcowski-niepracownik"]),
    );
    for (const id of r.citationIds) expect(CITATIONS[id]?.quote.length).toBeGreaterThan(40);
    expect(CITATIONS["zus-termin-niepracownik"].quote).toContain("przed terminem rozpoczęcia");
  });

  it("changing the start recalculates the period and the deadline", () => {
    const r = evaluatePaternity({ ...KAMIL, request: { start: "2027-01-11", days: 7 } });
    expect(r.period).toEqual({ start: "2027-01-11", end: "2027-01-17", days: 7 });
    expect(r.deadline).toBe("2027-01-10");
    // Start on 1 January: the deadline moves to the previous year.
    expect(evaluatePaternity({ ...KAMIL, request: { start: "2027-01-01", days: 14 } }).deadline).toBe("2026-12-31");
  });

  it("missing insurance confirmation → asks instead of deciding", () => {
    const r = evaluatePaternity({ ...KAMIL, insuranceConfirmed: null });
    expect(r.status).toBe("needs_info");
    expect(r.missing[0]).toBe("insurance_confirmed");
    expect(r.question).toMatch(/ubezpieczenie chorobowe/);
    expect(r.period).toBeNull();
    expect(r.deadline).toBeNull();
  });

  it("no insurance → no right, with the official fragment", () => {
    const r = evaluatePaternity({ ...KAMIL, insuranceConfirmed: false });
    expect(r.status).toBe("not_eligible");
    expect(r.citationIds).toContain("zam-info-prawo");
  });

  it("an earlier part changes the available period: only 7 days, part 2", () => {
    const prior = [{ start: "2026-07-01", end: "2026-07-07" }];
    const twoWeeks = evaluatePaternity({ ...KAMIL, priorParts: prior, request: { start: "2026-12-08", days: 14 } });
    expect(twoWeeks.status).toBe("needs_info");
    expect(twoWeeks.missing).toEqual(["request_days"]);
    expect(twoWeeks.question).toMatch(/Zostało Ci 7 dni/);

    const oneWeek = evaluatePaternity({ ...KAMIL, priorParts: prior });
    expect(oneWeek.status).toBe("eligible");
    expect(oneWeek.partNumber).toBe(2);
    expect(oneWeek.daysLeftAfter).toBe(0);

    // With one week left the length is not asked.
    const noDays = evaluatePaternity({ ...KAMIL, priorParts: prior, request: { start: "2026-12-08", days: null } });
    expect(noDays.status).toBe("eligible");
    expect(noDays.period?.days).toBe(7);
  });

  it("two parts or 14 days used → nothing left", () => {
    const used = evaluatePaternity({ ...KAMIL, priorParts: [{ start: "2026-06-01", end: "2026-06-14" }] });
    expect(used.status).toBe("not_eligible");
    const twoParts = evaluatePaternity({
      ...KAMIL,
      priorParts: [
        { start: "2026-06-01", end: "2026-06-07" },
        { start: "2026-08-01", end: "2026-08-07" },
      ],
    });
    expect(twoParts.status).toBe("not_eligible");
  });

  it("overlap with an earlier part is rejected", () => {
    const r = evaluatePaternity({ ...KAMIL, priorParts: [{ start: "2026-12-10", end: "2026-12-16" }] });
    expect(r.status).toBe("needs_info");
    expect(r.missing).toEqual(["request_start"]);
  });

  it("the period must end before the child completes 12 months", () => {
    const lastOk = evaluatePaternity({ ...KAMIL, request: { start: "2027-05-13", days: 7 } });
    expect(lastOk.status).toBe("eligible");
    expect(lastOk.period?.end).toBe("2027-05-19");
    const tooLate = evaluatePaternity({ ...KAMIL, request: { start: "2027-05-14", days: 7 } });
    expect(tooLate.status).toBe("needs_info");
    expect(tooLate.question).toMatch(/19 maja 2027/);
  });

  it("deadline already passed → asks for a later start", () => {
    const r = evaluatePaternity({ ...KAMIL, today: "2026-12-08" });
    expect(r.status).toBe("needs_info");
    expect(r.deadlinePassed).toBe(true);
    // The day before the start is still on time.
    expect(evaluatePaternity({ ...KAMIL, today: "2026-12-07" }).status).toBe("eligible");
  });

  it("asks for the start first when only the length is known", () => {
    const r = evaluatePaternity({ ...KAMIL, request: { start: null, days: 7 } });
    expect(r.status).toBe("needs_info");
    expect(r.missing).toEqual(["request_start"]);
  });

  it("no birth date yet → asks for it first", () => {
    const r = evaluatePaternity({ ...KAMIL, childBirthDate: null });
    expect(r.missing[0]).toBe("child_birth_date");
  });
});
