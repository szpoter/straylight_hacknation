import { addDays, daysBetween, formatShort, monthEnd } from "../rules/dates";
import { assessArrears } from "../rules/arrears";
import { RULE_PARAMETERS, formatValue, parameterOn, weeksLabel, type RuleParameterId, type RuleSchedule } from "../rules/parameters";
import { benefitPayer } from "../rules/payer";
import { RATE_LABEL, benefitForPeriod, dailyBenefitGrosze, formatGrosze, parentalMinimumTopUp, type RateKind } from "../rules/rates";
import { checkPaternityLimit, limitImpact, type CheckRow, type ImpactRow } from "./change-checks";
import { RATE_SCENARIOS, TOPUP_SCENARIOS, rateScenarioOutcome, topUpScenarioOutcome } from "./scenarios";

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
  /** Replaces the generic note when there is no parent view yet. */
  parentNote?: string;
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

/* ---------- parental benefit amount (podwyższenie, art. 31 ust. 3a) ---------- */

const DEMO_NET_GROSZE = 82000; // benefit after the tax advance in the impact example

const MINIMUM: ChangeSpec = {
  parameter: "benefit.parentalMinimum",
  catalogId: "app-parental-minimum",
  group: "Stawki",
  input: "integer",
  suffix: "zł",
  hint: "Miesięczna kwota w pełnych złotych (dziś 1000 zł, art. 17c ust. 5 ustawy o świadczeniach rodzinnych).",
  scope: "Miesiące zasiłku od tej daty. Za część miesiąca podwyższenie liczy się proporcjonalnie, według liczby dni kalendarzowych tego miesiąca.",
  parentView: null,
  impactNote: `Rodzic z zasiłkiem ${formatGrosze(DEMO_NET_GROSZE)} miesięcznie po zaliczce na podatek, cały miesiąc od dnia zmiany.`,
  toValue: integer,
  toText: (value) => String(value),
  impact: (published, draft) => {
    const next = withDraftFor(published, "benefit.parentalMinimum", draft);
    const month = (s: RuleSchedule) => parentalMinimumTopUp({ netGrosze: DEMO_NET_GROSZE, firstDay: draft.validFrom, days: "whole", schedule: s });
    const before = month(published);
    const after = month(next);
    const diff = after.paidGrosze - before.paidGrosze;
    return [
      { label: "Kwota świadczenia rodzicielskiego", before: formatGrosze(before.minimumGrosze), after: formatGrosze(after.minimumGrosze) },
      { label: "Podwyższenie", before: formatGrosze(before.topUpGrosze), after: formatGrosze(after.topUpGrosze) },
      { label: "Wypłata za miesiąc", before: formatGrosze(before.paidGrosze), after: formatGrosze(after.paidGrosze) },
      { label: "Różnica", before: "—", after: `${diff >= 0 ? "+" : "−"}${formatGrosze(Math.abs(diff))}` },
    ];
  },
  checks: (published, draft) => {
    const next = withDraftFor(published, "benefit.parentalMinimum", draft);
    const dayBefore = addDays(draft.validFrom, -1);
    const monthly = draft.value * 100;
    const end = monthEnd(draft.validFrom);
    const monthDays = Number(end.slice(8));
    const partialDays = Math.min(15, daysBetween(draft.validFrom, end) + 1);
    const dailyMinimum = Math.round(monthly / monthDays);
    const old = parameterOn(published, "benefit.parentalMinimum", dayBefore).value * 100;
    const topUp = (net: number, firstDay: string, days: number | "whole" = "whole") =>
      formatGrosze(parentalMinimumTopUp({ netGrosze: net, firstDay, days, schedule: next }).topUpGrosze);
    const rows: CheckRow[] = [
      row(`Zasiłek równy nowej kwocie (${formatGrosze(monthly)}), miesiąc od ${formatShort(draft.validFrom)}`, formatGrosze(0), topUp(monthly, draft.validFrom)),
      row(`Zasiłek o 1 zł niższy (${formatGrosze(monthly - 100)})`, formatGrosze(100), topUp(monthly - 100, draft.validFrom)),
      row(
        `Ten sam zasiłek w miesiącu od ${formatShort(dayBefore)}: obowiązuje ${formatGrosze(old)}`,
        formatGrosze(Math.max(0, old - (monthly - 100))),
        topUp(monthly - 100, dayBefore),
      ),
      row(
        `Część miesiąca od ${formatShort(draft.validFrom)} (liczba dni: ${partialDays}), zasiłek ${formatGrosze(0)}`,
        formatGrosze(10 * Math.ceil(dailyMinimum * partialDays / 10)),
        topUp(0, draft.validFrom, partialDays),
      ),
    ];
    for (const s of TOPUP_SCENARIOS) {
      const before = topUpScenarioOutcome(s, published);
      const after = topUpScenarioOutcome(s, next);
      if (before !== after) rows.push({ name: `${s.id}: ${s.title}`, expected: before, result: after, status: "informacja" });
    }
    rows.push(sourceRow(draft.source));
    return rows;
  },
};

/* ---------- calculator leave lengths, terms and the contribution deduction ---------- */

type LeaveId =
  | "maternity.weeks1"
  | "maternity.weeks2"
  | "maternity.weeks3"
  | "maternity.weeks4"
  | "maternity.weeks5"
  | "parental.weeksOne"
  | "parental.weeksMany"
  | "parental.weeksOneZaZyciem"
  | "parental.weeksManyZaZyciem"
  | "parental.exclusiveWeeks";

const MATERNITY_BY_CHILDREN = ["maternity.weeks1", "maternity.weeks2", "maternity.weeks3", "maternity.weeks4", "maternity.weeks5"] as const;
const CHILDREN_LABEL = ["jedno dziecko", "dwoje dzieci", "troje dzieci", "czworo dzieci", "pięcioro dzieci"];

/** The parent calculator does not read the panel's schedule yet. */
const CALCULATOR_NOTE =
  "Kalkulator rodzica (lib/rules/maternity.ts) stosuje na razie wartość z kodu. Po podpięciu harmonogramu " +
  "(lib/rules/maternity-schedule.ts) weźmie wartość z panelu. Wpływ powyżej to rachunek na wymiarach z panelu.";

const holds = (name: string, ok: boolean) => row(name, "tak", ok ? "tak" : "nie");

function datedRows(id: RuleParameterId, published: RuleSchedule, next: RuleSchedule, draft: DraftValue): CheckRow[] {
  const dayBefore = addDays(draft.validFrom, -1);
  const fmt = (v: number) => formatValue(id, v);
  return [
    row(`Od dnia zmiany (${formatShort(draft.validFrom)})`, fmt(draft.value), fmt(parameterOn(next, id, draft.validFrom).value)),
    row(
      `Dzień wcześniej (${formatShort(dayBefore)}) bez zmian`,
      fmt(parameterOn(published, id, dayBefore).value),
      fmt(parameterOn(next, id, dayBefore).value),
    ),
  ];
}

function leaveSpec(id: LeaveId): ChangeSpec {
  const weeks = (s: RuleSchedule, p: RuleParameterId, day: string) => parameterOn(s, p, day).value;
  const tyg = (n: number) => `${n} tyg.`;
  const n = (MATERNITY_BY_CHILDREN as readonly string[]).indexOf(id);
  const parentalFor = (children: number) => (children === 1 ? "parental.weeksOne" : "parental.weeksMany");
  const scope =
    id === "parental.exclusiveWeeks"
      ? "Dzieci urodzone lub przyjęte od tej daty. Część wyłączna pomniejsza pulę, którą rodzice mogą przekazać sobie nawzajem."
      : "Dzieci urodzone lub przyjęte od tej daty. O wartości decyduje dzień porodu albo przyjęcia dziecka.";
  return {
    parameter: id,
    catalogId: `app-${id.replace(".", "-")}`,
    group: "Wymiary",
    input: "integer",
    suffix: "tyg.",
    hint: "Liczba pełnych tygodni.",
    scope,
    parentView: null,
    parentNote: CALCULATOR_NOTE,
    impactNote:
      n >= 0
        ? `Rodzina, w której przy jednym porodzie rodzi się ${CHILDREN_LABEL[n]}, poród w dniu zmiany.`
        : id === "parental.exclusiveWeeks"
          ? "Oboje rodzice pracują, poród w dniu zmiany: ile tygodni mogą swobodnie podzielić."
          : "Rodzina z dzieckiem urodzonym w dniu zmiany: łączny okres zasiłku za urlopy.",
    toValue: integer,
    toText: (value) => String(value),
    impact: (published, draft) => {
      const next = withDraftFor(published, id, draft);
      const day = draft.validFrom;
      const rows: ImpactRow[] = [{ label: "Wymiar", before: tyg(weeks(published, id, day)), after: tyg(draft.value) }];
      if (n >= 0) {
        const total = (s: RuleSchedule) => weeks(s, id, day) + weeks(s, parentalFor(n + 1), day);
        rows.push({ label: "Razem z urlopem rodzicielskim", before: tyg(total(published)), after: tyg(total(next)) });
      } else if (id === "parental.exclusiveWeeks") {
        const free = (s: RuleSchedule, p: RuleParameterId) => weeks(s, p, day) - 2 * weeks(s, id, day);
        rows.push({ label: "Do podziału, jedno dziecko", before: tyg(free(published, "parental.weeksOne")), after: tyg(free(next, "parental.weeksOne")) });
        rows.push({
          label: "Do podziału, „Za życiem”",
          before: tyg(free(published, "parental.weeksOneZaZyciem")),
          after: tyg(free(next, "parental.weeksOneZaZyciem")),
        });
      } else {
        const maternity = id.includes("One") ? "maternity.weeks1" : "maternity.weeks2";
        const total = (s: RuleSchedule) => weeks(s, maternity, day) + weeks(s, id, day);
        rows.push({
          label: id.includes("One") ? "Razem z macierzyńskim, jedno dziecko" : "Razem z macierzyńskim, dwoje dzieci",
          before: tyg(total(published)),
          after: tyg(total(next)),
        });
      }
      return rows;
    },
    checks: (published, draft) => {
      const next = withDraftFor(published, id, draft);
      const day = draft.validFrom;
      const w = (p: RuleParameterId) => weeks(next, p, day);
      const rows = datedRows(id, published, next, draft);
      if (n >= 0) {
        if (n > 0) {
          const fewer = w(MATERNITY_BY_CHILDREN[n - 1]);
          rows.push(holds(`Nie krótszy niż dla mniejszej liczby dzieci (${tyg(fewer)})`, draft.value >= fewer));
        }
        if (n < 4) {
          const more = w(MATERNITY_BY_CHILDREN[n + 1]);
          rows.push(holds(`Nie dłuższy niż dla większej liczby dzieci (${tyg(more)})`, draft.value <= more));
        }
      } else if (id === "parental.exclusiveWeeks") {
        const one = w("parental.weeksOne");
        rows.push(holds(`Dwie części wyłączne mieszczą się w urlopie dla jednego dziecka (${tyg(one)})`, 2 * draft.value <= one));
      } else {
        const exclusive = w("parental.exclusiveWeeks");
        rows.push(holds(`Mieści dwie części wyłączne rodziców (2 × ${tyg(exclusive)})`, draft.value >= 2 * exclusive));
        rows.push(holds("Jedno dziecko: nie dłużej niż przy więcej dzieciach", w("parental.weeksOne") <= w("parental.weeksMany")));
        rows.push(
          holds(
            "Z zaświadczeniem „Za życiem” nie krócej niż bez niego",
            w("parental.weeksOneZaZyciem") >= w("parental.weeksOne") && w("parental.weeksManyZaZyciem") >= w("parental.weeksMany"),
          ),
        );
      }
      rows.push(sourceRow(draft.source));
      return rows;
    },
  };
}

const AVERAGED_REQUEST: ChangeSpec = {
  parameter: "averaged.requestDays",
  catalogId: "app-averaged-requestDays",
  group: "Terminy",
  input: "integer",
  suffix: "dni",
  hint: "Liczba dni po porodzie lub przyjęciu dziecka (dziś 21, art. 30a ustawy zasiłkowej).",
  scope: "Porody i przyjęcia dziecka od tej daty.",
  parentView: null,
  parentNote: CALCULATOR_NOTE,
  impactNote: "Matka rodzi w dniu zmiany i chce stawki uśrednionej 81,5% za cały okres.",
  toValue: integer,
  toText: (value) => String(value),
  impact: (published, draft) => {
    const old = parameterOn(published, "averaged.requestDays", draft.validFrom).value;
    return [
      { label: "Termin", before: formatValue("averaged.requestDays", old), after: formatValue("averaged.requestDays", draft.value) },
      {
        label: `Poród ${formatShort(draft.validFrom)}: wniosek najpóźniej`,
        before: formatShort(addDays(draft.validFrom, old)),
        after: formatShort(addDays(draft.validFrom, draft.value)),
      },
    ];
  },
  checks: (published, draft) => {
    const next = withDraftFor(published, "averaged.requestDays", draft);
    return [...datedRows("averaged.requestDays", published, next, draft), sourceRow(draft.source)];
  },
};

const DEMO_GROSS_GROSZE = 600000; // 6 000 zł a month

const CONTRIBUTIONS: ChangeSpec = {
  parameter: "contributions.employeePct",
  catalogId: "app-contributions-employeePct",
  group: "Podstawa",
  input: "percent",
  suffix: "%",
  hint: "Od 0 do 50, z dokładnością do 0,01 (dziś 13,71: emerytalna 9,76, rentowa 1,5, chorobowa 2,45).",
  scope: "Przychód za miesiące od tej daty wliczany do podstawy wymiaru zasiłku.",
  parentView: null,
  parentNote: CALCULATOR_NOTE,
  impactNote: `Pracownik z przychodem ${formatGrosze(DEMO_GROSS_GROSZE)} miesięcznie.`,
  toValue: (text) => {
    const t = text.replace(/\s/g, "").replace(",", ".").replace(/%$/, "");
    if (!/^\d{1,2}(\.\d{1,2})?$/.test(t)) return null;
    return Math.round(Number(t) * 100);
  },
  toText: (value) => String(value / 100).replace(".", ","),
  impact: (published, draft) => {
    const old = parameterOn(published, "contributions.employeePct", draft.validFrom).value;
    const base = (pct100: number) => Math.round((DEMO_GROSS_GROSZE * (10000 - pct100)) / 10000);
    return [
      {
        label: "Pomniejszenie",
        before: formatValue("contributions.employeePct", old),
        after: formatValue("contributions.employeePct", draft.value),
      },
      { label: "Podstawa miesięczna", before: formatGrosze(base(old)), after: formatGrosze(base(draft.value)) },
      { label: "Zasiłek 100% za dzień (1/30)", before: formatGrosze(Math.round(base(old) / 30)), after: formatGrosze(Math.round(base(draft.value) / 30)) },
    ];
  },
  checks: (published, draft) => {
    const next = withDraftFor(published, "contributions.employeePct", draft);
    return [...datedRows("contributions.employeePct", published, next, draft), sourceRow(draft.source)];
  },
};

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
  MINIMUM,
  ...MATERNITY_BY_CHILDREN.map(leaveSpec),
  leaveSpec("parental.weeksOne"),
  leaveSpec("parental.weeksMany"),
  leaveSpec("parental.weeksOneZaZyciem"),
  leaveSpec("parental.weeksManyZaZyciem"),
  leaveSpec("parental.exclusiveWeeks"),
  AVERAGED_REQUEST,
  CONTRIBUTIONS,
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
