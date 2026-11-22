import { addDays, formatShort } from "../rules/dates";
import { assessArrears } from "../rules/arrears";
import { RULE_PARAMETERS, formatValue, parameterOn, weeksLabel, type RuleParameterId, type RuleSchedule } from "../rules/parameters";
import { benefitPayer } from "../rules/payer";
import { RATE_LABEL, benefitForPeriod, dailyBenefitGrosze, formatGrosze, type RateKind } from "../rules/rates";
import { checkPaternityLimit, limitImpact, type CheckRow, type ImpactRow } from "./change-checks";
import { RATE_SCENARIOS, rateScenarioOutcome } from "./scenarios";

/**
 * Every parameter the admin panel can change for real (ZUS task p. 14), with how it is typed in,
 * what "Sprawdź zmianę" checks (SPEC-PANEL §7 table: stawka, wymiar lub limit, formularz, próg
 * płatnika) and what "Wpływ na rodzinę" shows. Pure: runs on the server for checks before
 * publication and in the browser for the live impact.
 */

export interface DraftValue {
  value: number;
  validFrom: string;
}

export interface ChangeSpec {
  parameter: RuleParameterId;
  /** Id of the parameter row in the panel catalogue. */
  catalogId: string;
  group: string;
  input: "weeks" | "percent" | "integer" | "flag";
  suffix: string;
  hint: string;
  /** Which cases the change applies to; shown read-only in the form. */
  scope: string;
  /** Parent view that applies published values, for "Pokaż oczami rodzica"; null = none yet. */
  parentView: string | null;
  impactNote: string;
  toValue(text: string): number | null;
  toText(value: number): string;
  impact(published: RuleSchedule, draft: DraftValue): ImpactRow[];
  checks(published: RuleSchedule, draft: DraftValue & { source: string }): CheckRow[];
}

/* ---------- helpers ---------- */

export function withDraftFor(schedule: RuleSchedule, id: RuleParameterId, draft: DraftValue): RuleSchedule {
  const others = (schedule[id] ?? []).filter((v) => v.validFrom !== draft.validFrom);
  return { ...schedule, [id]: [...others, { value: draft.value, validFrom: draft.validFrom }] };
}

const row = (name: string, expected: string, result: string): CheckRow => ({
  name,
  expected,
  result,
  status: expected === result ? "zgodna" : "niezgodna",
});

const sourceRow = (source: string) => row("Podstawa zmiany", "uzupełniona", source.trim() ? "uzupełniona" : "brak");

const integer = (text: string): number | null => {
  const t = text.replace(/\s/g, "");
  return /^\d+$/.test(t) ? Number(t) : null;
};

/* ---------- paternity total (wymiar) ---------- */

const PATERNITY: ChangeSpec = {
  parameter: "paternity.totalDays",
  catalogId: "app-paternity-total",
  group: "Wymiary",
  input: "weeks",
  suffix: "tyg.",
  hint: "Od 1 do 4 tygodni. Aplikacja przyjmuje części po tydzień lub dwa, najwyżej dwie.",
  scope: "Okresy zasiłku zaczynające się od tej daty. O wartości decyduje pierwszy dzień okresu, za który rodzic wnioskuje.",
  parentView: "/app/kamil",
  impactNote: "Ojciec z dobrowolnym ubezpieczeniem, dziecko ma 2 miesiące w dniu zmiany. Wnioskuje o cały nowy wymiar.",
  toValue: (text) => {
    const weeks = integer(text);
    return weeks === null ? null : weeks * 7;
  },
  toText: (value) => String(value / 7),
  impact: (published, draft) => limitImpact(published, draft),
  checks: (published, draft) => checkPaternityLimit(published, draft),
};

/* ---------- rates (stawka) ---------- */

const RATE_PARAM: Record<RateKind, RuleParameterId> = {
  maternity: "rate.maternity",
  parental: "rate.parental",
  averaged: "rate.averaged",
};

const DEMO_BASE_GROSZE = 20000; // SPEC-PANEL §12: daily base 200 zł
const DEMO_DAYS = 28;

function rateSpec(kind: RateKind): ChangeSpec {
  const id = RATE_PARAM[kind];
  const other: RateKind = kind === "parental" ? "maternity" : "parental";
  const pct = (rate10: number) => formatValue(id, rate10);
  return {
    parameter: id,
    catalogId: `app-${id.replace(".", "-")}`,
    group: "Stawki",
    input: "percent",
    suffix: "%",
    hint: "Od 0 do 100, z dokładnością do 0,1 (np. 75 albo 81,5).",
    scope: `Dni zasiłku za ${RATE_LABEL[kind]} od tej daty. Okres, który przecina datę, jest liczony w dwóch częściach.`,
    parentView: null,
    impactNote: `Podstawa dzienna ${formatGrosze(DEMO_BASE_GROSZE)}, jeden okres ${DEMO_DAYS} dni od dnia zmiany.`,
    toValue: (text) => {
      const t = text.replace(/\s/g, "").replace(",", ".").replace(/%$/, "");
      if (!/^\d{1,3}(\.\d)?$/.test(t)) return null;
      return Math.round(Number(t) * 10);
    },
    toText: (value) => String(value / 10).replace(".", ","),
    impact: (published, draft) => {
      const next = withDraftFor(published, id, draft);
      const amount = (s: RuleSchedule) =>
        benefitForPeriod({ kind, dailyBase: DEMO_BASE_GROSZE / 100, start: draft.validFrom, days: DEMO_DAYS, schedule: s });
      const before = amount(published);
      const after = amount(next);
      const diff = after.totalGrosze - before.totalGrosze;
      return [
        { label: "Stawka", before: pct(before.parts[0].rate10), after: pct(after.parts[0].rate10) },
        { label: "Za dzień", before: formatGrosze(before.parts[0].dailyGrosze), after: formatGrosze(after.parts[0].dailyGrosze) },
        { label: `Za ${DEMO_DAYS} dni`, before: formatGrosze(before.totalGrosze), after: formatGrosze(after.totalGrosze) },
        { label: "Różnica", before: "—", after: `${diff >= 0 ? "+" : "−"}${formatGrosze(Math.abs(diff))}` },
      ];
    },
    checks: (published, draft) => {
      const next = withDraftFor(published, id, draft);
      const dayBefore = addDays(draft.validFrom, -1);
      const oldRate = parameterOn(published, id, dayBefore).value;
      const daily = (rate10: number) => dailyBenefitGrosze(DEMO_BASE_GROSZE, rate10);
      const run = (k: RateKind, start: string, days: number) =>
        formatGrosze(benefitForPeriod({ kind: k, dailyBase: DEMO_BASE_GROSZE / 100, start, days, schedule: next }).totalGrosze);
      const otherRate = parameterOn(published, RATE_PARAM[other], draft.validFrom).value;
      const rows: CheckRow[] = [
        row(
          `Sprawa w zakresie zmiany: ${DEMO_DAYS} dni od ${formatShort(draft.validFrom)}, ${pct(draft.value)}`,
          formatGrosze(DEMO_DAYS * daily(draft.value)),
          run(kind, draft.validFrom, DEMO_DAYS),
        ),
        row(
          `Sprawa kończąca się dzień przed zmianą (${formatShort(dayBefore)}): obowiązuje ${pct(oldRate)}`,
          formatGrosze(DEMO_DAYS * daily(oldRate)),
          run(kind, addDays(draft.validFrom, -DEMO_DAYS), DEMO_DAYS),
        ),
        row(
          `Sprawa spoza zakresu: ${RATE_LABEL[other]} od ${formatShort(draft.validFrom)}, ${formatValue(RATE_PARAM[other], otherRate)}`,
          formatGrosze(DEMO_DAYS * daily(otherRate)),
          run(other, draft.validFrom, DEMO_DAYS),
        ),
        row(
          `Okres przecinający datę zmiany: 3 dni po ${pct(oldRate)} i 4 dni po ${pct(draft.value)}`,
          formatGrosze(3 * daily(oldRate) + 4 * daily(draft.value)),
          run(kind, addDays(draft.validFrom, -3), 7),
        ),
      ];
      const outside: string[] = [];
      const changedOutside: string[] = [];
      for (const s of RATE_SCENARIOS) {
        const end = addDays(s.start, s.days - 1);
        const before = rateScenarioOutcome(s, published);
        const after = rateScenarioOutcome(s, next);
        if (end < draft.validFrom) {
          outside.push(s.id);
          if (before !== after) changedOutside.push(s.id);
        } else if (before !== after) {
          rows.push({ name: `${s.id}: ${s.title} (w zakresie zmiany)`, expected: before, result: after, status: "informacja" });
        }
      }
      rows.push(
        row(
          `Sprawy testowe sprzed daty zmiany (${outside.length ? outside.join(", ") : "brak"})`,
          "wynik bez zmian",
          changedOutside.length ? `zmiana w ${changedOutside.join(", ")}` : "wynik bez zmian",
        ),
      );
      rows.push(sourceRow(draft.source));
      return rows;
    },
  };
}

/* ---------- payer threshold (próg płatnika) ---------- */

const payerLabel = (p: "employer" | "zus" | null) => (p === "employer" ? "pracodawca" : p === "zus" ? "ZUS" : "do ustalenia");

const PAYER: ChangeSpec = {
  parameter: "payer.insuredThreshold",
  catalogId: "app-payer-threshold",
  group: "Kto wypłaca",
  input: "integer",
  suffix: "ubezp.",
  hint: "Liczba ubezpieczonych, powyżej której płatnik sam wypłaca zasiłki (dziś 20).",
  scope: "Zasiłki za dni od tej daty. Liczbę ubezpieczonych ustala się na 30 listopada poprzedniego roku.",
  parentView: null,
  impactNote: "Pracownik, zasiłek od dnia zmiany. Kto wypłaca przy różnej wielkości pracodawcy.",
  toValue: integer,
  toText: (value) => String(value),
  impact: (published, draft) => {
    const next = withDraftFor(published, "payer.insuredThreshold", draft);
    const who = (count: number, s: RuleSchedule) =>
      payerLabel(benefitPayer({ situation: "employee", payerInsuredCount: count, benefitDate: draft.validFrom, schedule: s }).payer);
    const sizes = [...new Set([draft.value, draft.value + 1, 20, 21])].sort((a, b) => a - b);
    return [
      {
        label: "Próg",
        before: formatValue("payer.insuredThreshold", parameterOn(published, "payer.insuredThreshold", draft.validFrom).value),
        after: formatValue("payer.insuredThreshold", draft.value),
      },
      ...sizes.map((n) => ({ label: `Pracodawca z ${n} ubezp.`, before: who(n, published), after: who(n, next) })),
    ];
  },
  checks: (published, draft) => {
    const next = withDraftFor(published, "payer.insuredThreshold", draft);
    const dayBefore = addDays(draft.validFrom, -1);
    const old = parameterOn(published, "payer.insuredThreshold", dayBefore).value;
    const who = (count: number, day: string, situation: "employee" | "self_employed" = "employee") =>
      payerLabel(benefitPayer({ situation, payerInsuredCount: count, benefitDate: day, schedule: next }).payer);
    const t = draft.value;
    return [
      row(`Pracodawca z ${t} ubezpieczonymi, zasiłek od ${formatShort(draft.validFrom)}`, "ZUS", who(t, draft.validFrom)),
      row(`Pracodawca z ${t + 1} ubezpieczonymi, zasiłek od ${formatShort(draft.validFrom)}`, "pracodawca", who(t + 1, draft.validFrom)),
      row(
        `Pracodawca z ${t + 1} ubezpieczonymi, zasiłek dzień przed zmianą: próg ${old}`,
        t + 1 > old ? "pracodawca" : "ZUS",
        who(t + 1, dayBefore),
      ),
      row("Prowadzący działalność: zawsze ZUS", "ZUS", who(500, draft.validFrom, "self_employed")),
      sourceRow(draft.source),
    ];
  },
};

/* ---------- minimum wage (próg zadłużenia) ---------- */

const arrearsLabel = (status: string) =>
  status === "within_limit"
    ? "nie wstrzymuje"
    : status === "withheld_until_paid"
      ? "wstrzymuje do spłaty"
      : status === "not_applicable"
        ? "nie dotyczy"
        : status;

const WAGE: ChangeSpec = {
  parameter: "wage.minimum",
  catalogId: "app-wage-minimum",
  group: "Podstawa",
  input: "integer",
  suffix: "zł",
  hint: "Kwota brutto w pełnych złotych. 1% tej kwoty to próg zadłużenia składkowego (art. 2a).",
  scope: "Prawo do świadczenia powstające od tej daty: zadłużenie składkowe ocenia się na ten dzień.",
  parentView: null,
  impactNote: "Osoba prowadząca działalność z długiem składkowym w dniu powstania prawa do zasiłku.",
  toValue: integer,
  toText: (value) => String(value),
  impact: (published, draft) => {
    const next = withDraftFor(published, "wage.minimum", draft);
    const assess = (debt: number, s: RuleSchedule) =>
      assessArrears({ covered: true, arrears: debt, rightArisesOn: draft.validFrom, paidOn: null, today: draft.validFrom, schedule: s });
    const before = assess(0, published).threshold;
    const after = assess(0, next).threshold;
    const debt = Math.round(((before + after) / 2) * 100) / 100;
    const zl = (v: number) => formatGrosze(Math.round(v * 100));
    return [
      { label: "Płaca minimalna", before: formatValue("wage.minimum", assess(0, published).minimumWage), after: formatValue("wage.minimum", draft.value) },
      { label: "Próg zadłużenia (1%)", before: zl(before), after: zl(after) },
      { label: `Dług ${zl(debt)}`, before: arrearsLabel(assess(debt, published).status), after: arrearsLabel(assess(debt, next).status) },
    ];
  },
  checks: (published, draft) => {
    const next = withDraftFor(published, "wage.minimum", draft);
    const dayBefore = addDays(draft.validFrom, -1);
    const threshold = Math.round(draft.value) / 100;
    const oldThreshold = Math.round(parameterOn(published, "wage.minimum", dayBefore).value) / 100;
    const assess = (debt: number, day: string, covered = true) =>
      arrearsLabel(assessArrears({ covered, arrears: debt, rightArisesOn: day, paidOn: null, today: day, schedule: next }).status);
    const above = Math.round((threshold + 0.01) * 100) / 100;
    const zl = (v: number) => formatGrosze(Math.round(v * 100));
    return [
      row(`Dług równy progowi ${zl(threshold)} w dniu ${formatShort(draft.validFrom)}`, "nie wstrzymuje", assess(threshold, draft.validFrom)),
      row(`Dług o 1 grosz wyższy (${zl(above)})`, "wstrzymuje do spłaty", assess(above, draft.validFrom)),
      row(
        `Ten sam dług ${zl(above)} dzień przed zmianą: próg ${zl(oldThreshold)}`,
        above > oldThreshold ? "wstrzymuje do spłaty" : "nie wstrzymuje",
        assess(above, dayBefore),
      ),
      row("Pracownik: zasada nie dotyczy", "nie dotyczy", assess(above, draft.validFrom, false)),
      sourceRow(draft.source),
    ];
  },
};

/* ---------- forms catalogue (formularz) ---------- */

const FORM_IDS = ["form.ZAM", "form.ZUR", "form.ZAO", "form.Z3", "form.Z3a", "form.Z3b", "form.ZAS12", "form.ZAS53"] as const;
type FormId = (typeof FORM_IDS)[number];

function formSpec(id: FormId): ChangeSpec {
  const status = (s: RuleSchedule, day: string) => formatValue(id, parameterOn(s, id, day).value);
  return {
    parameter: id,
    catalogId: `app-${id.replace(".", "-")}`,
    group: "Formularze",
    input: "flag",
    suffix: "",
    hint: "Czy formularz obowiązuje od tej daty.",
    scope: "Wnioski składane od tej daty.",
    parentView: null,
    impactNote: "Rodzic składający wniosek w dniu zmiany i dzień wcześniej.",
    toValue: (text) => (text === "1" ? 1 : text === "0" ? 0 : null),
    toText: (value) => String(value),
    impact: (published, draft) => {
      const next = withDraftFor(published, id, draft);
      const dayBefore = addDays(draft.validFrom, -1);
      return [
        { label: `Wniosek ${formatShort(dayBefore)}`, before: status(published, dayBefore), after: status(next, dayBefore) },
        { label: `Wniosek ${formatShort(draft.validFrom)}`, before: status(published, draft.validFrom), after: status(next, draft.validFrom) },
      ];
    },
    checks: (published, draft) => {
      const next = withDraftFor(published, id, draft);
      const dayBefore = addDays(draft.validFrom, -1);
      const rows: CheckRow[] = [
        row(`Status w dniu zmiany (${formatShort(draft.validFrom)})`, formatValue(id, draft.value), status(next, draft.validFrom)),
        row(`Status dzień wcześniej (${formatShort(dayBefore)})`, status(published, dayBefore), status(next, dayBefore)),
      ];
      if (id === "form.ZAM" && draft.value === 0) {
        rows.push({
          name: "Sprawa Kamila korzysta z wniosku ZAM",
          expected: "obowiązuje",
          result: "wycofany: szkice do sprawdzenia po zmianie",
          status: "informacja",
        });
      }
      rows.push(sourceRow(draft.source));
      return rows;
    },
  };
}

/* ---------- registry ---------- */

export const CHANGE_SPECS: ChangeSpec[] = [
  PATERNITY,
  rateSpec("maternity"),
  rateSpec("parental"),
  rateSpec("averaged"),
  PAYER,
  WAGE,
  ...FORM_IDS.map(formSpec),
];

export function changeSpecFor(catalogId: string): ChangeSpec | null {
  return CHANGE_SPECS.find((s) => s.catalogId === catalogId) ?? null;
}

export function catalogIdFor(parameter: RuleParameterId): string {
  return CHANGE_SPECS.find((s) => s.parameter === parameter)?.catalogId ?? "";
}

/** Short label of a value for headings, e.g. "2 tygodnie" for the paternity total. */
export function displayValue(id: RuleParameterId, value: number): string {
  return RULE_PARAMETERS[id].unit === "days" && RULE_PARAMETERS[id].step === 7 ? weeksLabel(value) : formatValue(id, value);
}
