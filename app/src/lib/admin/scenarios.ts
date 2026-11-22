import type { PaternityResult } from "../kamil/contract";
import { formatRange, formatShort } from "../rules/dates";
import { formatValue, type RuleParameterId, type RuleSchedule } from "../rules/parameters";
import { RATES_RULES_VERSION, RATE_LABEL, benefitForPeriod, formatGrosze, type PeriodBenefit, type RateKind } from "../rules/rates";
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

/* ---------- benefit amounts (lib/rules/rates.ts) ---------- */

export interface RateScenario {
  id: string;
  title: string;
  tag: string;
  kind: RateKind;
  /** Daily base of the benefit in PLN; null = not known yet. */
  dailyBase: number | null;
  start: string;
  days: number;
  /** Worked out by hand from the task's rates, independent of the rule code. */
  expect: { rate10: number; dailyGrosze: number; totalGrosze: number } | null;
}

/** Fictional families. Amounts: daily base × rate, rounded to the grosz, × days. */
export const RATE_SCENARIOS: RateScenario[] = [
  {
    id: "R-01",
    title: "Urlop rodzicielski 4 tygodnie, podstawa 200 zł",
    tag: "Przykład demo (+280 zł)",
    kind: "parental",
    dailyBase: 200,
    start: "2027-01-04",
    days: 28,
    expect: { rate10: 700, dailyGrosze: 14000, totalGrosze: 392000 },
  },
  {
    id: "R-02",
    title: "Urlop macierzyński 20 tygodni, podstawa 150 zł",
    tag: "Stawka 100%",
    kind: "maternity",
    dailyBase: 150,
    start: "2026-12-07",
    days: 140,
    expect: { rate10: 1000, dailyGrosze: 15000, totalGrosze: 2100000 },
  },
  {
    id: "R-03",
    title: "Stawka uśredniona za urlop macierzyński, podstawa 200 zł",
    tag: "Stawka 81,5%",
    kind: "averaged",
    dailyBase: 200,
    start: "2026-12-07",
    days: 140,
    expect: { rate10: 815, dailyGrosze: 16300, totalGrosze: 2282000 },
  },
  {
    id: "R-04",
    title: "Zaokrąglenie do grosza, podstawa 133,33 zł",
    tag: "Stawka 70%",
    kind: "parental",
    dailyBase: 133.33,
    start: "2027-01-04",
    days: 28,
    expect: { rate10: 700, dailyGrosze: 9333, totalGrosze: 261324 },
  },
  {
    id: "R-05",
    title: "Brak podstawy wymiaru zasiłku",
    tag: "Brakujące dane",
    kind: "parental",
    dailyBase: null,
    start: "2027-01-04",
    days: 28,
    expect: null,
  },
];

const RATE_PARAMETER: Record<RateKind, RuleParameterId> = {
  maternity: "rate.maternity",
  parental: "rate.parental",
  averaged: "rate.averaged",
};

const rateText = (kind: RateKind, rate10: number) => formatValue(RATE_PARAMETER[kind], rate10);
const partsRate = (kind: RateKind, b: PeriodBenefit) => b.parts.map((p) => rateText(kind, p.rate10)).join(" / ");
const partsDaily = (b: PeriodBenefit) => b.parts.map((p) => formatGrosze(p.dailyGrosze)).join(" / ");

/** Short outcome of a rate scenario under a schedule, for "Sprawdź zmianę". */
export function rateScenarioOutcome(s: RateScenario, schedule: RuleSchedule): string {
  if (s.dailyBase === null) return "brak podstawy";
  return formatGrosze(benefitForPeriod({ kind: s.kind, dailyBase: s.dailyBase, start: s.start, days: s.days, schedule }).totalGrosze);
}

export function rateTestCases(schedule: RuleSchedule = {}): TestCase[] {
  return RATE_SCENARIOS.map((s) => {
    const inputs = [
      { label: "Okres", value: `${RATE_LABEL[s.kind]}, ${s.days} dni od ${formatShort(s.start)}` },
      { label: "Podstawa dzienna", value: s.dailyBase === null ? "—" : formatGrosze(Math.round(s.dailyBase * 100)) },
    ];
    if (s.dailyBase === null || !s.expect) {
      return {
        id: s.id,
        title: s.title,
        tag: s.tag,
        status: "brak-danych",
        inputs,
        expected: [{ label: "Za okres", value: "do ustalenia" }],
        result: [],
        missing: "Brakuje dziennej podstawy wymiaru zasiłku. Bez niej nie liczymy kwoty.",
        computedBy: `lib/rules/rates.ts · ${RATES_RULES_VERSION}`,
      };
    }
    const b = benefitForPeriod({ kind: s.kind, dailyBase: s.dailyBase, start: s.start, days: s.days, schedule });
    const expected = [
      { label: "Stawka", value: rateText(s.kind, s.expect.rate10) },
      { label: "Za dzień", value: formatGrosze(s.expect.dailyGrosze) },
      { label: "Za okres", value: formatGrosze(s.expect.totalGrosze) },
    ];
    const result = [
      { label: "Stawka", value: partsRate(s.kind, b) },
      { label: "Za dzień", value: partsDaily(b) },
      { label: "Za okres", value: formatGrosze(b.totalGrosze) },
    ];
    const matches = expected.every((e, i) => e.value === result[i].value);
    return {
      id: s.id,
      title: s.title,
      tag: s.tag,
      status: matches ? "zgodna" : "niezgodna",
      inputs,
      expected,
      result,
      reasons: b.parts.map(
        (p) => `${formatShort(p.from)}–${formatShort(p.to)}: ${p.days} dni × ${formatGrosze(p.dailyGrosze)} (${rateText(s.kind, p.rate10)})`,
      ),
      computedBy: `lib/rules/rates.ts · ${b.rulesVersion}`,
    };
  });
}

/** Every test case of the panel, evaluated with the values published in this demo session. */
export function allTestCases(schedule: RuleSchedule = {}): TestCase[] {
  return [...paternityTestCases(schedule), ...rateTestCases(schedule)];
}
