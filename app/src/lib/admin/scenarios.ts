import type { PaternityResult } from "../kamil/contract";
import { formatRange, formatShort } from "../rules/dates";
import { RULE_PARAMETERS, formatValue, type RuleParameterId, type RuleSchedule } from "../rules/parameters";
import {
  RATES_RULES_VERSION,
  RATE_LABEL,
  benefitForPeriod,
  formatGrosze,
  parentalMinimumTopUp,
  type PeriodBenefit,
  type RateKind,
} from "../rules/rates";
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

/* ---------- results moved by a published change ---------- */

/**
 * Status of a case that does not match: "do-aktualizacji" when it matches on the initial values,
 * so the difference comes from a change published in this session, with the change named.
 */
function mismatchStatus(
  schedule: RuleSchedule,
  matchesUnder: (s: RuleSchedule) => boolean,
): { status: "niezgodna" } | { status: "do-aktualizacji"; outdatedBy: string } {
  if (!matchesUnder({})) return { status: "niezgodna" };
  const published = (Object.keys(schedule) as RuleParameterId[]).filter((id) => schedule[id]?.length);
  const alone = published.filter((id) => {
    const rest = { ...schedule };
    delete rest[id];
    return matchesUnder(rest);
  });
  const causes = (alone.length ? alone : published).map((id) => {
    const values = schedule[id]!.map((v) => `${formatValue(id, v.value)} od ${formatShort(v.validFrom)}`).join(", ");
    return `${RULE_PARAMETERS[id].label}: ${values}`;
  });
  return {
    status: "do-aktualizacji",
    outdatedBy:
      `Wynik zmienił się po opublikowanej zmianie (${causes.join("; ")}). ` +
      "Oczekiwany wynik policzono dla wartości początkowych. Jeśli zmiana jest zamierzona, zaktualizuj oczekiwania tej sprawy.",
  };
}

/** Short outcome of a scenario under a schedule; used to show what a rule change does to each case. */
export function scenarioOutcome(s: Scenario, schedule: RuleSchedule): string {
  const r = evaluatePaternity({ ...s.input, schedule });
  return r.period ? STATUS_LABEL[r.status] + ", " + formatRange(r.period.start, r.period.end) : STATUS_LABEL[r.status];
}

/** Scenarios evaluated with the rule values published in this demo session. */
export function paternityTestCases(schedule: RuleSchedule = {}): TestCase[] {
  return PATERNITY_SCENARIOS.map((s) => {
    const expected = { ...s.expect, status: STATUS_LABEL[s.expect.status] };
    const keys = (Object.keys(ROW_LABELS) as (keyof typeof ROW_LABELS)[]).filter((k) => expected[k] !== undefined);
    const matchesUnder = (sch: RuleSchedule) => {
      const values = resultValues(evaluatePaternity({ ...s.input, schedule: sch }));
      return keys.every((k) => expected[k] === values[k]);
    };
    const r = evaluatePaternity({ ...s.input, schedule });
    const actual = resultValues(r);
    const matches = keys.every((k) => expected[k] === actual[k]);
    const missingProfile = r.status === "needs_info" && PROFILE_FIELDS.has(r.missing[0] ?? "");
    return {
      id: s.id,
      title: s.title,
      tag: s.tag,
      ...(missingProfile && matches ? { status: "brak-danych" as const } : matches ? { status: "zgodna" as const } : mismatchStatus(schedule, matchesUnder)),
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
    const { dailyBase, expect } = s;
    const expected = [
      { label: "Stawka", value: rateText(s.kind, expect.rate10) },
      { label: "Za dzień", value: formatGrosze(expect.dailyGrosze) },
      { label: "Za okres", value: formatGrosze(expect.totalGrosze) },
    ];
    const computeUnder = (sch: RuleSchedule) => {
      const benefit = benefitForPeriod({ kind: s.kind, dailyBase, start: s.start, days: s.days, schedule: sch });
      const rows = [
        { label: "Stawka", value: partsRate(s.kind, benefit) },
        { label: "Za dzień", value: partsDaily(benefit) },
        { label: "Za okres", value: formatGrosze(benefit.totalGrosze) },
      ];
      return { benefit, rows, matches: expected.every((e, i) => e.value === rows[i].value) };
    };
    const { benefit: b, rows: result, matches } = computeUnder(schedule);
    const matchesUnder = (sch: RuleSchedule) => computeUnder(sch).matches;
    return {
      id: s.id,
      title: s.title,
      tag: s.tag,
      ...(matches ? { status: "zgodna" as const } : mismatchStatus(schedule, matchesUnder)),
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

/* ---------- raise to the parental benefit amount (art. 31 ust. 3a) ---------- */

export interface TopUpScenario {
  id: string;
  title: string;
  tag: string;
  /** Monthly benefit after the income-tax advance, in grosze. */
  netGrosze: number;
  firstDay: string;
  days: number | "whole";
  /** Original panel reference, retained for comparison with the rule in force. */
  expect: { minimumGrosze: number; topUpGrosze: number; paidGrosze: number };
}

export const TOPUP_SCENARIOS: TopUpScenario[] = [
  {
    id: "R-06",
    title: "Zasiłek poniżej kwoty świadczenia rodzicielskiego, cały miesiąc",
    tag: "Podwyższenie (art. 31 ust. 3a)",
    netGrosze: 82000,
    firstDay: "2027-01-01",
    days: "whole",
    expect: { minimumGrosze: 100000, topUpGrosze: 18000, paidGrosze: 100000 },
  },
  {
    id: "R-07",
    title: "Podwyższenie za część miesiąca: 15 dni",
    tag: "Historyczny wzorzec podwyższenia (1/30)",
    netGrosze: 41000,
    firstDay: "2027-02-14",
    days: 15,
    expect: { minimumGrosze: 50000, topUpGrosze: 9000, paidGrosze: 50000 },
  },
  {
    id: "R-08",
    title: "Zasiłek powyżej kwoty świadczenia rodzicielskiego",
    tag: "Bez podwyższenia",
    netGrosze: 151200,
    firstDay: "2027-01-01",
    days: "whole",
    expect: { minimumGrosze: 100000, topUpGrosze: 0, paidGrosze: 151200 },
  },
];

const topUpOf = (s: TopUpScenario, schedule: RuleSchedule) =>
  parentalMinimumTopUp({ netGrosze: s.netGrosze, firstDay: s.firstDay, days: s.days, schedule });

/** Short outcome of a top-up scenario under a schedule, for "Sprawdź zmianę". */
export function topUpScenarioOutcome(s: TopUpScenario, schedule: RuleSchedule): string {
  const r = topUpOf(s, schedule);
  return `podwyższenie ${formatGrosze(r.topUpGrosze)}, wypłata ${formatGrosze(r.paidGrosze)}`;
}

export function topUpTestCases(schedule: RuleSchedule = {}): TestCase[] {
  return TOPUP_SCENARIOS.map((s) => {
    const rows = (v: { minimumGrosze: number; topUpGrosze: number; paidGrosze: number }) => [
      { label: "Najniższa kwota za okres", value: formatGrosze(v.minimumGrosze) },
      { label: "Podwyższenie", value: formatGrosze(v.topUpGrosze) },
      { label: "Wypłata", value: formatGrosze(v.paidGrosze) },
    ];
    const expected = rows(s.expect);
    const matchesUnder = (sch: RuleSchedule) => rows(topUpOf(s, sch)).every((r, i) => r.value === expected[i].value);
    const r = topUpOf(s, schedule);
    const period = s.days === "whole" ? `cały miesiąc od ${formatShort(s.firstDay)}` : `${s.days} dni od ${formatShort(s.firstDay)}`;
    return {
      id: s.id,
      title: s.title,
      tag: s.tag,
      ...(matchesUnder(schedule) ? { status: "zgodna" as const } : mismatchStatus(schedule, matchesUnder)),
      inputs: [
        { label: "Okres", value: period },
        { label: "Zasiłek macierzyński po zaliczce na podatek", value: formatGrosze(s.netGrosze) },
      ],
      expected,
      result: rows(r),
      reasons: [
        "Art. 31 ust. 3a: zasiłek niższy niż kwota świadczenia rodzicielskiego podwyższa się do tej kwoty.",
        s.days === "whole"
          ? "Za cały miesiąc porównuje się z pełną kwotą miesięczną."
          : `Kwotę miesięczną dzieli się przez liczbę dni kalendarzowych miesiąca. Stawkę zaokrągla się do grosza, mnoży przez ${s.days} i zaokrągla w górę do 10 gr.`,
        "Porównuje się zasiłek po potrąceniu zaliczki na podatek (poradnik ZUS, s. 20).",
      ],
      computedBy: `lib/rules/rates.ts · ${r.rulesVersion}`,
    };
  });
}

/** Every test case of the panel, evaluated with the values published in this demo session. */
export function allTestCases(schedule: RuleSchedule = {}): TestCase[] {
  return [...paternityTestCases(schedule), ...rateTestCases(schedule), ...topUpTestCases(schedule)];
}
