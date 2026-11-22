/**
 * Kalkulator zasiłku macierzyńskiego: podstawa wymiaru, okresy urlopów obojga rodziców, stawki,
 * kwoty dzienne i wypłaty miesiąc po miesiącu. Treść zadania ZUS, s. 13, pkt b–f i j.
 *
 * Źródła reguł (materiały ZUS do zadania, sprawdzone 22.11.2026):
 * - ustawa zasiłkowa (UZ): art. 29a, 30a, 31 (stawki, podwyższenie, łączenie z pracą),
 *   art. 36–38, 45, 47, 48, 52 (podstawa), art. 3 pkt 3–4 (13,71%);
 * - Kodeks pracy (KP): art. 180, 180², 182¹a–182¹f, 182³, 183 (wymiary urlopów);
 * - załącznik ZUS „maksymalny czas trwania zasiłków, wysokość, podstawa wymiaru”;
 * - zus.pl „Wysokość zasiłku macierzyńskiego” (podwyższenie do 1000 zł, bez urlopu ojcowskiego).
 *
 * Zgodność z decyzjami ZUS z zestawów spraw (testy `tests/maternity.test.ts`): stawka dzienna
 * = podstawa × stawka ÷ 30, zaokrąglona do grosza; wypłata = stawka dzienna × dni kalendarzowe;
 * podstawa = średnia z miesięcy × (1 − 13,71%), bez miesięcy przepracowanych w mniej niż połowie.
 *
 * Miejsca, których materiały nie rozstrzygają, mają `assumption` w wyniku — UI pokazuje je jako
 * „do weryfikacji”. Kwoty są brutto; podatek to szacunek (osobno, `estimateNet`).
 */
import { addDays, addMonths, daysBetween, isValidIso } from "./dates";
import { hospitalLeaveWeeks, type HospitalCertificate } from "./hospital-stays";
import { maternityParametersOn } from "./maternity-schedule";
import { rateOn, type RateKind } from "./rates";
import { MINIMUM_WAGE } from "./arrears";
import { valueWithDefaults, type RuleSchedule, type ScheduledValue } from "./parameters";

export const MATERNITY_RULES_VERSION = "maternity-2026-11-22.2";

// ---------- Parametry (do panelu administracyjnego) ----------

/** Wartości liczbowe z materiałów ZUS. Zmiana przepisów = zmiana tych liczb, nie kodu. */
export const MATERNITY_PARAMETERS = {
  /** Składki na ubezpieczenia społeczne finansowane przez ubezpieczonego (UZ art. 3 pkt 3–4). */
  deductionPct: 13.71,
  /** Stawki (UZ art. 31 ust. 1–3). */
  rateMaternity: 100,
  rateParental: 70,
  rateAveraged: 81.5,
  /** Wymiar urlopu macierzyńskiego i na warunkach macierzyńskiego wg liczby dzieci (KP art. 180 § 1, art. 183 § 1). */
  maternityWeeks: [20, 31, 33, 35, 37],
  /** Najkrótszy urlop na warunkach urlopu macierzyńskiego (KP art. 183 § 3; załącznik ZUS). */
  adoptionMinWeeks: 9,
  /** Urlop rodzicielski: 1 dziecko / więcej, oraz z zaświadczeniem „Za życiem” (KP art. 182¹a § 1–2). */
  parentalWeeks: { one: 41, many: 43, oneZaZyciem: 65, manyZaZyciem: 67 },
  /** Wyłączna, nieprzenoszalna część każdego z rodziców (KP art. 182¹a § 4). */
  exclusiveWeeks: 9,
  /** Limity urlopu rodzicielskiego łączonego z pracą (KP art. 182¹f § 1–1¹). */
  parentalWithWorkMaxWeeks: { one: 82, many: 86, oneZaZyciem: 130, manyZaZyciem: 134 },
  /** Urlop macierzyński po urodzeniu martwego dziecka: tygodnie po porodzie (KP art. 180¹ § 1). */
  stillbirthWeeksAfterBirth: 8,
  /** Najwyżej tyle tygodni macierzyńskiego przed porodem (KP art. 180 § 2). */
  maxWeeksBeforeBirth: 6,
  /** Matka wykorzystuje osobiście co najmniej tyle tygodni po porodzie (KP art. 180 § 4). */
  motherMinWeeksAfterBirth: 14,
  /** Urlop ojcowski (KP art. 182³ § 1): do 14 dni, do ukończenia przez dziecko 12 miesięcy. */
  paternityDays: 14,
  paternityMonths: 12,
  /** Wniosek o 81,5% najpóźniej tyle dni po porodzie / przyjęciu (UZ art. 30a ust. 1–2). */
  averagedRequestDays: 21,
  /** Kwota świadczenia rodzicielskiego — podwyższenie zasiłku (UZ art. 31 ust. 3a; zus.pl). */
  parentalAllowance: 1000,
  /** Maks. podstawa zasiłku niepracownika w 2026 r. (załącznik ZUS: 23 550 zł − 13,71%). */
  nonEmployeeBasisCap: 20321.3,
} as const;

/**
 * Płaca minimalna do minimalnej podstawy pracownika (UZ art. 45). 2024: decyzja ZUS z zestawu
 * spraw (4 242 zł, od lipca 4 300 zł); dalej harmonogram z `arrears.ts` (Julian).
 */
export const MINIMUM_WAGE_HISTORY: readonly ScheduledValue[] = [
  { value: 4242, validFrom: "2024-01-01" },
  { value: 4300, validFrom: "2024-07-01" },
  ...MINIMUM_WAGE,
];

// ---------- Źródła ----------

export type SourceId =
  | "uz31"
  | "uz30a"
  | "uz36"
  | "uz38"
  | "uz45"
  | "uz48"
  | "kp180"
  | "kp180-2"
  | "kp182-1a"
  | "kp182-1f"
  | "kp182-3"
  | "kp183"
  | "zusAmount"
  | "zusBasisEmployee"
  | "zusBasisNonEmployee"
  | "govParental"
  | "zalacznik";

export const SOURCES: Record<SourceId, { label: string; url?: string }> = {
  uz31: { label: "Ustawa zasiłkowa, art. 31 (stawki, podwyższenie, łączenie z pracą)", url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/wysokosc" },
  uz30a: { label: "Ustawa zasiłkowa, art. 30a (wniosek o 81,5% w ciągu 21 dni)", url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/wysokosc" },
  uz36: { label: "Ustawa zasiłkowa, art. 36 (12 miesięcy, 1/30 podstawy na dzień)", url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/podstawa-wymiaru/dla-pracownikow" },
  uz38: { label: "Ustawa zasiłkowa, art. 38 (miesiące przepracowane w mniej niż połowie)", url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/podstawa-wymiaru/dla-pracownikow" },
  uz45: { label: "Ustawa zasiłkowa, art. 45 (podstawa nie niższa niż płaca minimalna − 13,71%)", url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/podstawa-wymiaru/dla-pracownikow" },
  uz48: { label: "Ustawa zasiłkowa, art. 48 (przychód niepracownika z 12 miesięcy)", url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/podstawa-wymiaru/dla-ubezpieczonych-niebedacych-pracownikami" },
  kp180: { label: "Kodeks pracy, art. 180 (urlop macierzyński 20–37 tygodni)", url: "https://www.gov.pl/web/rodzina/urlop-macierzynski" },
  "kp180-2": { label: "Kodeks pracy, art. 180² (uzupełniający urlop macierzyński)", url: "https://www.gov.pl/web/rodzina/urlop-macierzynski" },
  "kp182-1a": { label: "Kodeks pracy, art. 182¹a (urlop rodzicielski 41/43/65/67 tygodni, 9 tygodni wyłącznie)", url: "https://www.gov.pl/web/rodzina/urlop-rodzicielski" },
  "kp182-1f": { label: "Kodeks pracy, art. 182¹e–182¹f (łączenie urlopu rodzicielskiego z pracą)", url: "https://www.gov.pl/web/rodzina/urlop-rodzicielski" },
  "kp182-3": { label: "Kodeks pracy, art. 182³ (urlop ojcowski 2 tygodnie)", url: "https://www.gov.pl/web/rodzina/urlop-ojcowski" },
  kp183: { label: "Kodeks pracy, art. 183 (adopcja, rodzina zastępcza)", url: "https://www.gov.pl/web/rodzina/urlop-macierzynski" },
  zusAmount: { label: "zus.pl · Wysokość zasiłku macierzyńskiego", url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/wysokosc" },
  zusBasisEmployee: { label: "zus.pl · Podstawa wymiaru dla pracowników", url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/podstawa-wymiaru/dla-pracownikow" },
  zusBasisNonEmployee: {
    label: "zus.pl · Podstawa wymiaru dla niepracowników",
    url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/podstawa-wymiaru/dla-ubezpieczonych-niebedacych-pracownikami",
  },
  govParental: { label: "gov.pl · Urlop rodzicielski", url: "https://www.gov.pl/web/rodzina/urlop-rodzicielski" },
  zalacznik: { label: "Załącznik ZUS do zadania: czas trwania, wysokość, podstawa wymiaru" },
};

// ---------- Typy ----------

export type EventKind = "birth" | "adoption" | "foster";
export type PayVariant = "815" | "100-70";
export type ParentId = "A" | "B";
export type InsuranceTitle = "pracownik" | "zleceniobiorca" | "dzialalnosc";
export type LeaveKind = "macierzynski" | "na-warunkach" | "uzupelniajacy" | "rodzicielski" | "ojcowski";

export type BasisMonth = {
  /** Wynagrodzenie brutto (pracownik) albo podstawa składki chorobowej (niepracownik). */
  amount: number;
  /** Przepracowany/ubezpieczony mniej niż połowę miesiąca — wyłączany (UZ art. 38 ust. 2). */
  underHalf?: boolean;
  /** Inny procent składek niż 13,71% (np. po przekroczeniu rocznego limitu składek, z Z-3). */
  deductionPct?: number;
};

export type BasisInput =
  /** Podstawa z decyzji ZUS albo z zaświadczenia płatnika (Z-3) — bez przeliczania. */
  | { kind: "known"; amount: number }
  /** Przeciętne miesięczne wynagrodzenie brutto / podstawa składek z 12 miesięcy. */
  | { kind: "average"; amount: number }
  /** Miesiąc po miesiącu (do 12). */
  | { kind: "months"; months: BasisMonth[] };

export type ParentInput = {
  title: InsuranceTitle;
  basis: BasisInput;
  /** Pracownik na pełny etat: podstawa nie niższa niż płaca minimalna − 13,71% (UZ art. 45). */
  fullTime: boolean;
};

export type ScenarioInput = {
  event: EventKind;
  /** Data porodu (albo przewidywana) / przyjęcia dziecka na wychowanie. */
  date: string;
  /** Liczba dzieci z jednego porodu / przyjętych jednocześnie (5 = 5 i więcej). */
  children: number;
  zaZyciem: boolean;
  /** Adopcja / rodzina zastępcza: data urodzenia dziecka (limit wieku). */
  childBirthDate?: string;
  /** Rodzina zastępcza: odroczony obowiązek szkolny (limit 10 lat zamiast 7). */
  schoolDeferred?: boolean;
  /** Urodzenie martwego dziecka (albo zgon przed 8. tygodniem życia): 8 tygodni po porodzie, 100% (KP art. 180¹). */
  stillbirth?: boolean;
  variant: PayVariant;
  parentA: ParentInput;
  /** null — drugi rodzic nie podlega ubezpieczeniu chorobowemu albo nie korzysta. */
  parentB: ParentInput | null;
  /** Tygodnie urlopu macierzyńskiego przed porodem (0–6). */
  weeksBeforeBirth: number;
  /** Exact dates from confirmed evidence; the form continues to accept whole weeks. */
  prenatalLeaveDays?: number;
  /** One date per deceased child; stillbirth is recorded on the delivery date. */
  childDeathDates?: string[];
  /** Tygodnie macierzyńskiego przejęte przez drugiego rodzica (po min. 14 tygodniach matki). */
  transferWeeks: number;
  /** Uzupełniający urlop macierzyński (wcześniak, hospitalizacja). */
  supplementaryWeeks: number;
  /** Dated, complete hospital evidence takes precedence over manually estimated weeks. */
  hospitalCertificate?: HospitalCertificate;
  supplementaryParent: ParentId;
  parentalWeeksA: number;
  parentalWeeksB: number;
  parentalOrder: "sequential" | "together";
  /** Ułamek etatu pracy w czasie urlopu rodzicielskiego (0 – bez pracy, najwyżej 0,5). */
  workA: number;
  workB: number;
  /** Urlop ojcowski drugiego rodzica: 0, 7 albo 14 dni. */
  paternityDays: number;
  paternityStart?: string;
  schedule?: RuleSchedule;
};

export type BasisStep = { text: string; value?: number; source: SourceId; assumption?: boolean };

export type BasisResult = {
  basis: number;
  steps: BasisStep[];
  /** Pełny etat pracownika: minimalna podstawa obowiązuje na każdy dzień (zmienia się z płacą minimalną). */
  floorApplies: boolean;
  monthsUsed: number;
  monthsExcluded: number;
};

export type Segment = {
  periodId: string;
  parent: ParentId;
  kind: LeaveKind;
  /** YYYY-MM */
  month: string;
  from: string;
  to: string;
  days: number;
  ratePct: number;
  work: number;
  basis: number;
  daily: number;
  amount: number;
  /** Dopłata do kwoty świadczenia rodzicielskiego (UZ art. 31 ust. 3a). */
  topUp: number;
};

export type Period = {
  id: string;
  parent: ParentId;
  kind: LeaveKind;
  label: string;
  from: string;
  to: string;
  days: number;
  ratePct: number;
  work: number;
  /** Stawka dzienna w pierwszym miesiącu okresu (może wzrosnąć z płacą minimalną). */
  daily: number;
  amount: number;
  topUp: number;
  note?: string;
};

export type Deadline = { date: string; label: string; who: ParentId | "both"; source: SourceId };

export type Message = { text: string; source?: SourceId };

export type ScenarioResult = {
  ok: boolean;
  errors: Message[];
  warnings: Message[];
  assumptions: Message[];
  limits: {
    maternityWeeks: number;
    parentalPoolWeeks: number;
    exclusiveWeeks: number;
    maxParentalOneParent: number;
    parentalWithWorkMaxWeeks: number;
  };
  basis: { A: BasisResult; B: BasisResult | null };
  periods: Period[];
  segments: Segment[];
  totals: { A: number; B: number; all: number; topUp: number };
  /** Pierwszy i ostatni dzień urlopów z zasiłkiem (bez urlopu ojcowskiego). */
  span: { from: string; to: string; days: number } | null;
  deadlines: Deadline[];
};

// ---------- Arytmetyka w groszach ----------

/** Zaokrąglenie do grosza „od połowy w górę” (dla kwot nieujemnych). */
export function round2(value: number): number {
  return Math.round(value * 100 + 1e-7) / 100;
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

export function minimumWageOn(date: string, schedule?: RuleSchedule): number {
  return valueWithDefaults(schedule, "wage.minimum", date, MINIMUM_WAGE_HISTORY).value;
}

/** Minimalna podstawa pracownika na pełny etat w danym dniu: płaca minimalna − 13,71% (UZ art. 45). */
export function minimumBasisOn(date: string, schedule?: RuleSchedule): number {
  const p = maternityParametersOn(schedule, date);
  const wage = minimumWageOn(date, schedule);
  return Number.isFinite(wage) ? round2((wage * (100 - p.deductionPct)) / 100) : 0;
}

// ---------- Podstawa wymiaru ----------

/** 12 miesięcy kalendarzowych przed miesiącem powstania prawa (UZ art. 36 ust. 1) — etykiety dla formularza. */
export function basisMonthLabels(eventDate: string): string[] {
  const first = `${eventDate.slice(0, 7)}-01`;
  return Array.from({ length: 12 }, (_, i) => addMonths(first, i - 12).slice(0, 7));
}

export function computeBasis(parent: ParentInput, eventDate: string, schedule?: RuleSchedule): BasisResult {
  const p = maternityParametersOn(schedule, eventDate);
  const employee = parent.title === "pracownik";
  const steps: BasisStep[] = [];
  const floorApplies = employee && parent.fullTime;
  let basis: number;
  let monthsUsed = 0;
  let monthsExcluded = 0;

  if (parent.basis.kind === "known") {
    basis = round2(parent.basis.amount);
    steps.push({ text: "Podstawa wymiaru z decyzji ZUS / zaświadczenia płatnika", value: basis, source: employee ? "zusBasisEmployee" : "zusBasisNonEmployee" });
  } else {
    const months: BasisMonth[] = parent.basis.kind === "average" ? [{ amount: parent.basis.amount }] : parent.basis.months.filter((m) => m.amount >= 0);
    const labels = basisMonthLabels(eventDate).slice(-months.length);
    const datedMonths = months.map((m, i) => ({
      ...m,
      deductionPct: m.deductionPct ?? (parent.basis.kind === "months"
        ? maternityParametersOn(schedule, labels[i] + "-01").deductionPct : p.deductionPct),
    }));
    const full = datedMonths.filter((m) => !m.underHalf);
    // Gdy w każdym miesiącu przepracowano mniej niż połowę — bierze się wszystkie (UZ art. 38 ust. 3).
    const used = full.length > 0 ? full : datedMonths;
    monthsUsed = used.length;
    monthsExcluded = months.length - used.length;
    if (used.length === 0) {
      basis = 0;
    } else {
      const net = used.map((m) => (m.amount * (100 - (m.deductionPct ?? p.deductionPct))) / 100);
      const gross = sum(used.map((m) => m.amount)) / used.length;
      basis = round2(sum(net) / used.length);
      if (parent.basis.kind === "months") {
        steps.push({
          text: `Średnia z ${used.length} ${used.length === 1 ? "miesiąca" : "miesięcy"}${monthsExcluded ? ` (pominięte: ${monthsExcluded} — mniej niż połowa miesiąca)` : ""}`,
          value: round2(gross),
          source: monthsExcluded ? "uz38" : employee ? "uz36" : "uz48",
        });
      } else {
        steps.push({ text: employee ? "Przeciętne miesięczne wynagrodzenie brutto" : "Przeciętna miesięczna podstawa składki chorobowej", value: round2(gross), source: employee ? "uz36" : "uz48" });
      }
      const custom = used.some((m) => m.deductionPct !== undefined && m.deductionPct !== p.deductionPct);
      steps.push({
        text: custom ? "Minus składki społeczne (procent z zaświadczenia płatnika)" : `Minus ${p.deductionPct.toString().replace(".", ",")}% składek społecznych`,
        value: basis,
        source: employee ? "zusBasisEmployee" : "zusBasisNonEmployee",
      });
    }
  }

  if (!employee && basis > p.nonEmployeeBasisCap && eventDate >= "2026-01-01" && eventDate < "2027-01-01") {
    basis = p.nonEmployeeBasisCap;
    steps.push({ text: "Ograniczenie do najwyższej podstawy niepracownika w 2026 r.", value: basis, source: "zalacznik" });
  }
  if (floorApplies) {
    const floor = minimumBasisOn(eventDate, schedule);
    if (basis < floor) {
      steps.push({ text: "Podniesione do minimalnej podstawy (płaca minimalna − 13,71%)", value: floor, source: "uz45" });
    }
  }
  return { basis, steps, floorApplies, monthsUsed, monthsExcluded };
}

/** Podstawa na dany dzień: przy pełnym etacie nie niższa niż minimalna w tym dniu (decyzja ZUS 2024: wzrost od lipca). */
export function basisOn(result: BasisResult, date: string, schedule?: RuleSchedule): number {
  return result.floorApplies ? Math.max(result.basis, minimumBasisOn(date, schedule)) : result.basis;
}

/** Stawka dzienna: podstawa × stawka × (1 − praca) ÷ 30, do grosza (UZ art. 36 ust. 3, art. 31 ust. 4a). */
export function dailyAmount(basis: number, ratePct: number, work = 0): number {
  return round2((basis * ratePct * (1 - work)) / 100 / 30);
}

// ---------- Wymiary ----------

const childIndex = (children: number) => Math.min(Math.max(Math.round(children), 1), 5) - 1;

export function limitsFor(input: Pick<ScenarioInput, "children" | "zaZyciem"> & { date?: string }, schedule?: RuleSchedule) {
  const p = input.date ? maternityParametersOn(schedule, input.date) : MATERNITY_PARAMETERS;
  const many = input.children > 1;
  const pool = input.zaZyciem ? (many ? p.parentalWeeks.manyZaZyciem : p.parentalWeeks.oneZaZyciem) : many ? p.parentalWeeks.many : p.parentalWeeks.one;
  const withWork = input.zaZyciem
    ? many
      ? p.parentalWithWorkMaxWeeks.manyZaZyciem
      : p.parentalWithWorkMaxWeeks.oneZaZyciem
    : many
      ? p.parentalWithWorkMaxWeeks.many
      : p.parentalWithWorkMaxWeeks.one;
  return {
    maternityWeeks: p.maternityWeeks[childIndex(input.children)],
    parentalPoolWeeks: pool,
    exclusiveWeeks: p.exclusiveWeeks,
    maxParentalOneParent: pool - p.exclusiveWeeks,
    parentalWithWorkMaxWeeks: withWork,
  };
}

/** KP art. 180 §1–2 and 180¹ §1–2, text in force 22.11.2026. Dates are inclusive. */
export function birthLeaveWindow(birth: string, children: number, prenatalDays: number, deathDates: readonly string[] = [], schedule?: RuleSchedule) {
  const p = maternityParametersOn(schedule, birth);
  if (!Number.isSafeInteger(children) || children < 1 || !Number.isInteger(prenatalDays) || prenatalDays < 0 || prenatalDays > 7 * p.maxWeeksBeforeBirth || deathDates.length > children) {
    throw new RangeError("invalid_birth_history");
  }
  const from = addDays(birth, -prenatalDays);
  const ordinaryEnd = (count: number) => addDays(from, p.maternityWeeks[childIndex(count)] * 7 - 1);
  const eightWeeksEnd = addDays(birth, 7 * p.stillbirthWeeksAfterBirth - 1);
  let to = ordinaryEnd(children);
  for (const [i, death] of [...deathDates].sort().entries()) {
    if (!isValidIso(death) || death < birth) throw new RangeError("invalid_child_death_date");
    if (death > to) continue;
    const remaining = children - i - 1;
    const remainingEnd = remaining ? ordinaryEnd(remaining) : eightWeeksEnd;
    const minimumEnd = addDays(death, 6);
    to = remaining && death <= eightWeeksEnd ? remainingEnd : [remainingEnd, minimumEnd].sort()[1];
  }
  return { from, to, days: daysBetween(from, to) + 1 };
}

/**
 * Uzupełniający urlop macierzyński (KP art. 180² § 1–3): tydzień za każdy tydzień pobytu dziecka
 * w szpitalu, niepełny tydzień w górę, najwyżej 15 tygodni (przed 28. tyg. ciąży lub ≤ 1000 g)
 * albo 8 tygodni (pozostałe przypadki).
 */
export function supplementaryWeeksFor(hospitalDays: number, extremePreterm: boolean): number {
  if (!(hospitalDays > 0)) return 0;
  return Math.min(Math.ceil(hospitalDays / 7), extremePreterm ? 15 : 8);
}

// ---------- Scenariusz ----------

const LABEL: Record<LeaveKind, string> = {
  macierzynski: "Urlop macierzyński",
  "na-warunkach": "Urlop na warunkach urlopu macierzyńskiego",
  uzupelniajacy: "Uzupełniający urlop macierzyński",
  rodzicielski: "Urlop rodzicielski",
  ojcowski: "Urlop ojcowski",
};

/** Ostatni dzień miesiąca. */
function monthEnd(iso: string): string {
  return addDays(addMonths(`${iso.slice(0, 7)}-01`, 1), -1);
}

function daysInMonth(iso: string): number {
  return Number(monthEnd(iso).slice(8, 10));
}

/** Dzieli okres na kawałki w miesiącach kalendarzowych. */
function splitByMonth(from: string, to: string, changeDays: string[]): Array<{ from: string; to: string; days: number }> {
  const parts: Array<{ from: string; to: string; days: number }> = [];
  let cur = from;
  while (cur <= to) {
    const boundary = changeDays.find(day => day > cur);
    const end = [monthEnd(cur), to, boundary ? addDays(boundary, -1) : to].sort()[0];
    parts.push({ from: cur, to: end, days: daysBetween(cur, end) + 1 });
    cur = addDays(end, 1);
  }
  return parts;
}

type RawPeriod = { id: string; parent: ParentId; kind: LeaveKind; from: string; days: number; rate: RateKind; work: number; note?: string };

export function computeScenario(given: ScenarioInput): ScenarioResult {
  const p = maternityParametersOn(given.schedule, given.date);
  const exactLoss = given.event === "birth" && given.childDeathDates?.length === given.children && given.children > 0;
  const stillbirth = (Boolean(given.stillbirth) || exactLoss) && given.event === "birth";
  // Martwe urodzenie: tylko urlop macierzyński matki, 100% (Poradnik ZUS 2026, s. 34), bez rodzicielskiego i ojcowskiego.
  const input: ScenarioInput = stillbirth
    ? { ...given, variant: given.stillbirth ? "100-70" : given.variant, transferWeeks: 0, supplementaryWeeks: 0, parentalWeeksA: 0, parentalWeeksB: 0, workA: 0, workB: 0, paternityDays: 0 }
    : given;
  const errors: Message[] = [];
  const warnings: Message[] = [];
  const assumptions: Message[] = [];
  let supplementaryWeeks = input.supplementaryWeeks;
  if (input.hospitalCertificate && !stillbirth) {
    const certificate = input.hospitalCertificate;
    if (certificate.children.length !== input.children || (input.event === "birth"
      ? certificate.birth !== input.date || !!certificate.acceptedOn
      : certificate.birth !== input.childBirthDate || certificate.acceptedOn !== input.date)) {
      errors.push({ text: "Zaświadczenie szpitala nie odpowiada dzieciom i zdarzeniu z wniosku.", source: "kp180-2" });
    } else {
      try {
        supplementaryWeeks = hospitalLeaveWeeks(certificate).weeks;
      } catch (issue) {
        if (!(issue instanceof RangeError)) throw issue;
        errors.push({ text: "Sprawdź daty pobytów, masy i wiek ciążowy na zaświadczeniu szpitala.", source: "kp180-2" });
      }
    }
  }
  const limits = limitsFor(input, input.schedule);
  const birth = input.event === "birth";
  const hasB = input.parentB !== null;

  const basisA = computeBasis(input.parentA, input.date, input.schedule);
  const basisB = input.parentB ? computeBasis(input.parentB, input.date, input.schedule) : null;

  // --- Wymiar macierzyńskiego / na warunkach ---
  let maternityWeeks: number = limits.maternityWeeks;
  if (!birth && input.childBirthDate) {
    const years = input.event === "adoption" ? 14 : input.schoolDeferred ? 10 : 7;
    const limitDay = addMonths(input.childBirthDate, years * 12);
    const available = Math.floor(daysBetween(input.date, limitDay) / 7);
    if (available < 0) {
      errors.push({ text: `Dziecko przekroczyło wiek, do którego przysługuje urlop na warunkach urlopu macierzyńskiego (${years} lat).`, source: "kp183" });
    } else if (available < maternityWeeks) {
      maternityWeeks = Math.max(p.adoptionMinWeeks, available);
      assumptions.push({
        text: `Urlop przysługuje do ukończenia przez dziecko ${years} lat — liczymy ${maternityWeeks} tyg. (nie mniej niż ${p.adoptionMinWeeks}). Sposób skrócenia do weryfikacji w ZUS.`,
        source: "kp183",
      });
    }
  }

  const weeksBefore = birth ? Math.min(Math.max(Math.round(input.weeksBeforeBirth), 0), p.maxWeeksBeforeBirth) : 0;
  if (stillbirth && !given.childDeathDates) {
    maternityWeeks = weeksBefore + p.stillbirthWeeksAfterBirth;
    assumptions.push({
      text: "Przy urodzeniu martwego dziecka zasiłek macierzyński przysługuje za 8 tygodni po porodzie (100%). Przy zgonie dziecka — nie krócej niż 7 dni od dnia zgonu; tego kalkulator nie liczy osobno.",
      source: "kp180",
    });
  }
  const transfer = hasB ? Math.max(Math.round(input.transferWeeks), 0) : 0;
  if (transfer > 0) {
    const motherAfter = maternityWeeks - transfer - weeksBefore;
    if (motherAfter < p.motherMinWeeksAfterBirth) {
      errors.push({
        text: `Matka musi wykorzystać co najmniej ${p.motherMinWeeksAfterBirth} tygodni urlopu macierzyńskiego po porodzie — drugi rodzic może przejąć najwyżej ${Math.max(maternityWeeks - weeksBefore - p.motherMinWeeksAfterBirth, 0)} tyg.`,
        source: "kp180",
      });
    }
  }

  // --- Rodzicielski: pula i 9 tygodni wyłącznie ---
  const weeksA = Math.max(Math.round(input.parentalWeeksA), 0);
  const weeksB = hasB ? Math.max(Math.round(input.parentalWeeksB), 0) : 0;
  if (weeksA > limits.maxParentalOneParent) {
    errors.push({ text: `Jeden rodzic może wziąć najwyżej ${limits.maxParentalOneParent} tyg. — ${limits.exclusiveWeeks} tygodni należy wyłącznie do drugiego rodzica.`, source: "kp182-1a" });
  }
  if (weeksB > limits.maxParentalOneParent) {
    errors.push({ text: `Drugi rodzic może wziąć najwyżej ${limits.maxParentalOneParent} tyg. — ${limits.exclusiveWeeks} tygodni należy wyłącznie do Ciebie.`, source: "kp182-1a" });
  }
  if (weeksA + weeksB > limits.parentalPoolWeeks) {
    errors.push({ text: `Razem możecie wykorzystać ${limits.parentalPoolWeeks} tyg. urlopu rodzicielskiego (teraz ${weeksA + weeksB}).`, source: "kp182-1a" });
  }
  if (!stillbirth && hasB && weeksB < limits.exclusiveWeeks) {
    warnings.push({
      text: `Drugi rodzic nie wykorzysta ${limits.exclusiveWeeks - weeksB} tyg. swojej wyłącznej części urlopu rodzicielskiego — tych tygodni nie można przenieść, przepadną.`,
      source: "kp182-1a",
    });
  }
  if (!stillbirth && !hasB) {
    warnings.push({ text: `Bez drugiego ubezpieczonego rodzica ${limits.exclusiveWeeks} tygodni jego wyłącznej części urlopu rodzicielskiego nie zostanie wykorzystanych.`, source: "kp182-1a" });
  }
  const workA = Math.min(Math.max(input.workA, 0), 0.5);
  const workB = Math.min(Math.max(input.workB, 0), 0.5);
  if (input.workA > 0.5 || input.workB > 0.5) {
    errors.push({ text: "W czasie urlopu rodzicielskiego można pracować najwyżej na pół etatu.", source: "kp182-1f" });
  }
  if ((workA > 0 && input.parentA.title !== "pracownik") || (workB > 0 && input.parentB?.title !== "pracownik")) {
    assumptions.push({ text: "Łączenie urlopu rodzicielskiego z pracą opisują przepisy dla pracowników; dla innych tytułów ubezpieczenia do weryfikacji.", source: "kp182-1f" });
  }
  if (supplementaryWeeks > 0 && input.supplementaryParent === "B" && !hasB) {
    errors.push({ text: "Uzupełniający urlop macierzyński wybrany dla drugiego rodzica, który nie jest ubezpieczony.", source: "kp180-2" });
  }
  if (input.paternityDays > 0 && !hasB) {
    errors.push({ text: "Zasiłek za urlop ojcowski przysługuje ojcu, który podlega ubezpieczeniu chorobowemu.", source: "kp182-3" });
  }

  const rateMat: RateKind = input.variant === "815" ? "averaged" : "maternity";
  const rateParental: RateKind = input.variant === "815" ? "averaged" : "parental";
  if (input.variant === "815" && transfer > 0) {
    assumptions.push({ text: "Przejętą część urlopu macierzyńskiego liczymy drugiemu rodzicowi po 81,5%, tak jak matce — materiały ZUS nie mówią tego wprost.", source: "uz31" });
  }
  if (input.variant === "815" && weeksB > limits.exclusiveWeeks) {
    assumptions.push({ text: `Tygodnie drugiego rodzica ponad jego wyłączne ${limits.exclusiveWeeks} liczymy po 81,5% (pierwsze ${limits.exclusiveWeeks} zawsze po 70%).`, source: "uz31" });
  }

  // --- Oś czasu ---
  const raw: RawPeriod[] = [];
  const kindMat: LeaveKind = birth ? "macierzynski" : "na-warunkach";
  const exactWindow = birth && (input.prenatalLeaveDays !== undefined || input.childDeathDates !== undefined)
    ? birthLeaveWindow(input.date, input.children, input.prenatalLeaveDays ?? weeksBefore * 7, input.childDeathDates ?? (input.stillbirth ? [input.date] : []), input.schedule)
    : undefined;
  const startA = exactWindow?.from ?? (birth ? addDays(input.date, -7 * weeksBefore) : input.date);
  const matDaysA = (exactWindow?.days ?? 7 * maternityWeeks) - 7 * transfer;
  raw.push({ id: "mat-A", parent: "A", kind: kindMat, from: startA, days: matDaysA, rate: rateMat, work: 0, note: weeksBefore ? `w tym ${weeksBefore} tyg. przed porodem` : undefined });
  let next = addDays(startA, matDaysA);
  if (transfer > 0) {
    raw.push({ id: "mat-B", parent: "B", kind: kindMat, from: next, days: 7 * transfer, rate: rateMat, work: 0, note: "przejęta część urlopu macierzyńskiego" });
    next = addDays(next, 7 * transfer);
  }
  if (supplementaryWeeks > 0) {
    if (input.hospitalCertificate && addDays(next, -1) < "2025-03-19") {
      errors.push({ text: "Urlop macierzyński zakończył się przed wejściem w życie przepisów o urlopie uzupełniającym.", source: "kp180-2" });
    }
    const weeks = Math.min(Math.round(supplementaryWeeks), 15);
    raw.push({ id: "sup", parent: input.supplementaryParent, kind: "uzupelniajacy", from: next, days: 7 * weeks, rate: "maternity", work: 0 });
    next = addDays(next, 7 * weeks);
  }
  const parentalStart = next;
  const capDays = limits.parentalWithWorkMaxWeeks * 7;
  const stretched = (weeks: number, work: number) => Math.min(Math.floor((7 * weeks) / (1 - work)), capDays);
  if (weeksA > 0) raw.push({ id: "par-A", parent: "A", kind: "rodzicielski", from: parentalStart, days: stretched(weeksA, workA), rate: rateParental, work: workA });
  if (weeksB > 0) {
    const fromB = input.parentalOrder === "together" || weeksA === 0 ? parentalStart : addDays(parentalStart, stretched(weeksA, workA));
    // 9 tygodni drugiego rodzica zawsze po 70% (UZ art. 31 ust. 3f); w wariancie 100/70 i tak 70%.
    const exclusive = Math.min(weeksB, limits.exclusiveWeeks);
    const exclusiveDays = stretched(exclusive, workB);
    raw.push({ id: "par-B", parent: "B", kind: "rodzicielski", from: fromB, days: exclusiveDays, rate: "parental", work: workB, note: "wyłączna część drugiego rodzica" });
    if (weeksB > exclusive) {
      raw.push({ id: "par-B2", parent: "B", kind: "rodzicielski", from: addDays(fromB, exclusiveDays), days: stretched(weeksB, workB) - exclusiveDays, rate: rateParental, work: workB });
    }
  }
  if (input.paternityDays > 0 && hasB) {
    const days = Math.min(Math.round(input.paternityDays), p.paternityDays);
    const start = input.paternityStart ?? input.date;
    const deadline = addDays(addMonths(input.date, p.paternityMonths), -1);
    if (addDays(start, days - 1) > deadline) {
      errors.push({ text: `Urlop ojcowski trzeba wykorzystać do ukończenia przez dziecko ${p.paternityMonths} miesięcy (do ${deadline}).`, source: "kp182-3" });
    }
    if (start < input.date) errors.push({ text: "Urlop ojcowski zaczyna się najwcześniej w dniu urodzenia lub przyjęcia dziecka.", source: "kp182-3" });
    raw.push({ id: "pat", parent: "B", kind: "ojcowski", from: start, days, rate: "maternity", work: 0 });
  }
  if (!birth && input.paternityDays > 0) {
    assumptions.push({ text: "Przy adopcji urlop ojcowski liczy się od uprawomocnienia postanowienia o przysposobieniu — przyjmujemy datę przyjęcia dziecka.", source: "kp182-3" });
  }

  // --- Kwoty ---
  const segments: Segment[] = [];
  const periods: Period[] = [];
  let topUpUsed = false;
  for (const r of raw.filter((x) => x.days > 0)) {
    const to = addDays(r.from, r.days - 1);
    const basis = r.parent === "A" ? basisA : basisB;
    if (!basis) continue;
    const changeDays = [
      ...(input.schedule?.[`rate.${r.rate}`] ?? []),
      ...(basis.floorApplies ? input.schedule?.["wage.minimum"] ?? [] : []),
    ].map(change => change.validFrom).filter(day => day > r.from && day <= to).sort();
    const segs: Segment[] = splitByMonth(r.from, to, changeDays).map((part) => {
      const ratePct = rateOn(r.rate, part.from, input.schedule) / 10;
      const allowance = maternityParametersOn(input.schedule, part.from.slice(0, 7) + "-01").parentalAllowance;
      const b = basisOn(basis, part.from, input.schedule);
      const daily = dailyAmount(b, ratePct, r.work);
      let amount = round2(daily * part.days);
      let topUp = 0;
      // Podwyższenie do świadczenia rodzicielskiego: nie dotyczy urlopu ojcowskiego (zus.pl); część miesiąca proporcjonalnie.
      if (r.kind !== "ojcowski" && (b * ratePct * (1 - r.work)) / 100 < allowance) {
        const floor = round2(round2(allowance / daysInMonth(part.from)) * part.days);
        if (floor > amount) {
          topUp = Math.ceil(round2(floor - amount) * 10 - 1e-7) / 10; // ZUS: dopłata zaokrąglana do 10 gr w górę
          amount = round2(amount + topUp);
          topUpUsed = true;
        }
      }
      return { periodId: r.id, parent: r.parent, kind: r.kind, month: part.from.slice(0, 7), from: part.from, to: part.to, days: part.days, ratePct, work: r.work, basis: b, daily, amount, topUp };
    });
    segments.push(...segs);
    periods.push({
      id: r.id,
      parent: r.parent,
      kind: r.kind,
      label: LABEL[r.kind],
      from: r.from,
      to,
      days: r.days,
      ratePct: segs[0].ratePct,
      work: r.work,
      daily: segs[0]?.daily ?? 0,
      amount: round2(sum(segs.map((s) => s.amount))),
      topUp: round2(sum(segs.map((s) => s.topUp))),
      note: r.note,
    });
  }
  if (topUpUsed) {
    assumptions.push({
      text: `Zasiłek niższy niż ${p.parentalAllowance} zł miesięcznie podwyższamy do tej kwoty. ZUS porównuje kwotę po zaliczce na podatek, ustawa — kwotę zasiłku; liczymy od kwoty brutto, do weryfikacji.`,
      source: "uz31",
    });
  }
  if (basisA.floorApplies || basisB?.floorApplies) {
    const wage = minimumWageOn(input.date, input.schedule);
    if (!Number.isFinite(wage)) assumptions.push({ text: "Brak płacy minimalnej dla tej daty — minimalnej podstawy nie sprawdzamy.", source: "uz45" });
  }

  const leave = periods.filter((x) => x.kind !== "ojcowski");
  const span = leave.length
    ? (() => {
        const from = leave.reduce((a, b) => (b.from < a ? b.from : a), leave[0].from);
        const to = leave.reduce((a, b) => (b.to > a ? b.to : a), leave[0].to);
        return { from, to, days: daysBetween(from, to) + 1 };
      })()
    : null;

  // --- Terminy ---
  const deadlines: Deadline[] = [];
  if (input.variant === "815") {
    deadlines.push({
      date: addDays(input.date, p.averagedRequestDays),
      label: birth ? "Wniosek o zasiłek 81,5% za cały okres — do 21 dni po porodzie" : "Wniosek o zasiłek 81,5% — do 21 dni po przyjęciu dziecka",
      who: "A",
      source: "uz30a",
    });
  }
  for (const per of periods.filter((x) => x.kind === "rodzicielski" && x.id !== "par-B2")) {
    const parent = per.parent === "A" ? input.parentA : input.parentB;
    if (parent?.title === "pracownik") {
      deadlines.push({ date: addDays(per.from, -21), label: "Wniosek o urlop rodzicielski do pracodawcy — co najmniej 21 dni przed", who: per.parent, source: "govParental" });
    }
  }
  const pat = periods.find((x) => x.kind === "ojcowski");
  if (pat && input.parentB?.title === "pracownik") {
    deadlines.push({ date: addDays(pat.from, -7), label: "Wniosek o urlop ojcowski do pracodawcy — co najmniej 7 dni przed", who: "B", source: "kp182-3" });
  }
  const sup = periods.find((x) => x.kind === "uzupelniajacy");
  const matEnd = periods.filter((x) => x.kind === kindMat).reduce<string | null>((a, b) => (a && a > b.to ? a : b.to), null);
  if (sup && matEnd) {
    deadlines.push({ date: addDays(matEnd, -21), label: "Wniosek o uzupełniający urlop macierzyński — co najmniej 21 dni przed końcem macierzyńskiego", who: sup.parent, source: "kp180-2" });
  }
  deadlines.sort((a, b) => a.date.localeCompare(b.date));

  const totalA = round2(sum(segments.filter((s) => s.parent === "A").map((s) => s.amount)));
  const totalB = round2(sum(segments.filter((s) => s.parent === "B").map((s) => s.amount)));
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    assumptions,
    limits: { ...limits, maternityWeeks },
    basis: { A: basisA, B: basisB },
    periods,
    segments,
    totals: { A: totalA, B: totalB, all: round2(totalA + totalB), topUp: round2(sum(segments.map((s) => s.topUp))) },
    span,
    deadlines,
  };
}

/** Wypłaty brutto w miesiącach kalendarzowych dla każdego rodzica. */
export function monthlyPayments(result: ScenarioResult): Array<{ month: string; A: number; B: number }> {
  const map = new Map<string, { A: number; B: number }>();
  for (const s of result.segments) {
    const row = map.get(s.month) ?? { A: 0, B: 0 };
    row[s.parent] = round2(row[s.parent] + s.amount);
    map.set(s.month, row);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({ month, ...v }));
}

/**
 * Szacunek kwoty „na rękę”: zaliczka na PIT 12% zaokrąglona do pełnych złotych, minus 300 zł,
 * gdy złożono PIT-2 (zus.pl: odliczanie 1/12 kwoty zmniejszającej podatek). Ulgi zwalniające
 * (PIT-0) — zaliczka 0. Tylko orientacyjnie; składki zdrowotnej od zasiłku się nie pobiera.
 */
export function estimateNet(gross: number, opts: { pit2: boolean; exempt: boolean }): { advance: number; net: number } {
  if (opts.exempt || gross <= 0) return { advance: 0, net: gross };
  const advance = Math.max(0, Math.round(gross * 0.12 - (opts.pit2 ? 300 : 0)));
  return { advance, net: round2(gross - advance) };
}
