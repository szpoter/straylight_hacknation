import type { PaternityResult } from "../kamil/contract";
import { formatRange, formatShort } from "../rules/dates";
import type { RuleSchedule } from "../rules/parameters";
import { evaluatePaternity, type PaternityInput } from "../rules/paternity";
import type { TestCase } from "./types";

/**
 * Test cases of the paternity rule (SPEC-PANEL §6). Pure: safe in the browser, used by the panel
 * views, by "Sprawdź zmianę" and by tests. Fictional data only, never ZUS competition case files.
 */

/** Kamil's profile from TECH-SPEC-AGENT.md, scenario 2: fictional data, as in tests/kamil-rules.test.ts. */
const KAMIL: PaternityInput = {
  childBirthDate: "2026-05-20",
  insuranceConfirmed: true,
  noArrears: true,
  priorParts: [],
  request: { start: "2026-12-08", days: 7 },
  today: "2026-11-21",
};

const STATUS_LABEL: Record<PaternityResult["status"], string> = {
  eligible: "przysługuje",
  not_eligible: "nie przysługuje",
  needs_info: "wymaga uzupełnienia",
};

interface Expectation {
  status: PaternityResult["status"];
  period?: string;
  deadline?: string;
  part?: string;
}

export interface Scenario {
  id: string;
  title: string;
  tag: string;
  input: PaternityInput;
  expect: Expectation;
}

/** Scenarios and expected results mirror the assertions in tests/kamil-rules.test.ts. */
export const PATERNITY_SCENARIOS: Scenario[] = [
  {
    id: "K-01",
    title: "Pierwszy tydzień od 8 grudnia",
    tag: "Przykład demo",
    input: KAMIL,
    expect: { status: "eligible", period: "8–14 grudnia 2026 r.", deadline: "07.12.2026", part: "1" },
  },
  {
    id: "K-02",
    title: "Druga część po wcześniejszym tygodniu",
    tag: "Części urlopu",
    input: { ...KAMIL, priorParts: [{ start: "2026-07-01", end: "2026-07-07" }] },
    expect: { status: "eligible", period: "8–14 grudnia 2026 r.", part: "2" },
  },
  {
    id: "K-03",
    title: "Wniosek dokładnie na limicie 12 miesięcy",
    tag: "Limit",
    input: { ...KAMIL, request: { start: "2027-05-13", days: 7 } },
    expect: { status: "eligible", period: "13–19 maja 2027 r." },
  },
  {
    id: "K-04",
    title: "Wniosek po ukończeniu przez dziecko 12 miesięcy",
    tag: "Limit",
    input: { ...KAMIL, request: { start: "2027-05-14", days: 7 } },
    expect: { status: "needs_info" },
  },
  {
    id: "K-05",
    title: "Termin złożenia ZAM już minął",
    tag: "Termin",
    input: { ...KAMIL, today: "2026-12-08" },
    expect: { status: "needs_info" },
  },
  {
    id: "K-06",
    title: "Brak ubezpieczenia chorobowego",
    tag: "Odmowa",
    input: { ...KAMIL, insuranceConfirmed: false },
    expect: { status: "not_eligible" },
  },
  {
    id: "K-07",
    title: "Wykorzystane już 14 dni",
    tag: "Odmowa",
    input: { ...KAMIL, priorParts: [{ start: "2026-06-01", end: "2026-06-14" }] },
    expect: { status: "not_eligible" },
  },
  {
    id: "K-08",
    title: "Brak potwierdzenia ubezpieczenia",
    tag: "Brakujące dane",
    input: { ...KAMIL, insuranceConfirmed: null },
    expect: { status: "needs_info" },
  },
];

const PROFILE_FIELDS = new Set(["child_birth_date", "insurance_confirmed", "no_arrears"]);

const yesNo = (v: boolean | null) => (v === null ? "brak potwierdzenia" : v ? "tak" : "nie");

function inputRows(input: PaternityInput) {
  const parts = input.priorParts.map((p) => formatRange(p.start, p.end)).join(", ");
  const request = input.request?.start
    ? `od ${formatShort(input.request.start)}${input.request.days ? `, ${input.request.days} dni` : ""}`
    : "—";
  return [
    { label: "Data urodzenia dziecka", value: input.childBirthDate ? formatShort(input.childBirthDate) : "—" },
    { label: "Dobrowolne ubezpieczenie chorobowe", value: yesNo(input.insuranceConfirmed) },
    { label: "Składki bez zaległości", value: yesNo(input.noArrears) },
    { label: "Wcześniej wykorzystane części", value: parts || "brak" },
    { label: "Wniosek", value: request },
    { label: "Dzień oceny", value: formatShort(input.today) },
  ];
}

function resultValues(r: PaternityResult): Required<Omit<Expectation, "status">> & { status: string } {
  return {
    status: STATUS_LABEL[r.status],
    period: r.period ? formatRange(r.period.start, r.period.end) : "—",
    deadline: r.deadline ? formatShort(r.deadline) : "—",
    part: r.partNumber ? String(r.partNumber) : "—",
  };
}

const ROW_LABELS = { status: "Wynik", period: "Okres", deadline: "Termin ZAM", part: "Część urlopu" } as const;

/** Short outcome of a scenario under a schedule; used to show what a rule change does to each case. */
export function scenarioOutcome(s: Scenario, schedule: RuleSchedule): string {
  const r = evaluatePaternity({ ...s.input, schedule });
  return r.period ? STATUS_LABEL[r.status] + ", " + formatRange(r.period.start, r.period.end) : STATUS_LABEL[r.status];
}

/** Scenarios evaluated with the rule values published in this demo session. */
export function paternityTestCases(schedule: RuleSchedule = {}): TestCase[] {
  return PATERNITY_SCENARIOS.map((s) => {
    const r = evaluatePaternity({ ...s.input, schedule });
    const actual = resultValues(r);
    const expected = { ...s.expect, status: STATUS_LABEL[s.expect.status] };
    const keys = (Object.keys(ROW_LABELS) as (keyof typeof ROW_LABELS)[]).filter((k) => expected[k] !== undefined);
    const matches = keys.every((k) => expected[k] === actual[k]);
    const missingProfile = r.status === "needs_info" && PROFILE_FIELDS.has(r.missing[0] ?? "");
    return {
      id: s.id,
      title: s.title,
      tag: s.tag,
      status: missingProfile && matches ? "brak-danych" : matches ? "zgodna" : "niezgodna",
      inputs: inputRows(s.input),
      expected: keys.map((k) => ({ label: ROW_LABELS[k], value: expected[k] as string })),
      result: keys.map((k) => ({ label: ROW_LABELS[k], value: actual[k] })),
      missing: missingProfile ? (r.question ?? undefined) : undefined,
      reasons: r.reasons.map((reason) => reason.text),
      computedBy: `lib/rules/paternity.ts · ${r.rulesVersion}`,
    };
  });
}
