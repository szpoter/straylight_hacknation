import { addMonths, isValidIso } from "./dates";
import { parameterOn, type RuleSchedule } from "./parameters";

/**
 * Czy osobie przysługuje zasiłek macierzyński (zadanie ZUS s. 13–14: „zweryfikować, czy osoba
 * posiada ubezpieczenie”). Czysta funkcja: fakty wchodzą, wynik z uzasadnieniem i identyfikatorami
 * fragmentów korpusu (`app/corpus/publiczne/fragments.jsonl`) wychodzi.
 *
 * Podstawa:
 * - ustawa zasiłkowa art. 29 ust. 1–2 (uz-29-1, uz-29-2): poród albo przyjęcie dziecka w okresie
 *   ubezpieczenia chorobowego, granice wieku, wyłączenie zawodowej rodziny zastępczej;
 * - art. 29a (uz-29a-1, uz-29a-2) i art. 31 ust. 3h (uz-31-5): drugi rodzic, także gdy matka
 *   nie jest objęta ubezpieczeniem;
 * - art. 30 (uz-30-1, uz-30-2): zasiłek po ustaniu ubezpieczenia w ciąży;
 * - art. 61 ust. 1 pkt 2 lit. d (uz-61-2): za okres po ustaniu ubezpieczenia wypłaca ZUS;
 * - art. 2a (uz-2a-1, uz-2a-2): zaległości w składkach osób, które same je opłacają;
 * - Poradnik ZUS 2026 s. 9, 10, 14, 36 (poradnik-9-1, poradnik-10-1, poradnik-14-1, poradnik-36-2):
 *   umowa dla pozoru, dobrowolne ubezpieczenie chorobowe zleceniobiorców i przedsiębiorców,
 *   wyrejestrowanie z dobrowolnego ubezpieczenia w czasie zasiłku.
 *
 * Reguła rozstrzyga tylko prawo do zasiłku. Kwotę i okres liczy kalkulator (`maternity.ts`).
 */

export const ELIGIBILITY_RULES_VERSION = "maternity-eligibility-2026-11-22";

/** Wszystkie fragmenty korpusu, na które reguła może się powołać (strona ładuje ich treść). */
export const ELIGIBILITY_LAW_IDS = [
  "uz-29-1",
  "uz-29-2",
  "uz-29a-1",
  "uz-29a-2",
  "uz-30-1",
  "uz-30-2",
  "uz-31-5",
  "uz-61-1",
  "uz-61-2",
  "uz-2a-1",
  "uz-2a-2",
  "poradnik-9-1",
  "poradnik-10-1",
  "poradnik-14-1",
  "poradnik-36-2",
] as const;
export type EligibilityLawId = (typeof ELIGIBILITY_LAW_IDS)[number];

export type Applicant = "rodzi" | "drugi-rodzic";
export type EventKind = "porod" | "przysposobienie" | "rodzina-zastepcza" | "rodzina-zastepcza-zawodowa";
export type InsuranceTitle = "pracownik" | "zleceniobiorca" | "dzialalnosc" | "wspolpracujacy" | "inny";
export type YesNoUnknown = "tak" | "nie" | "nie-wiem";
export type EmploymentEnd = "brak" | "upadlosc-likwidacja" | "smierc-pracodawcy" | "naruszenie-prawa-wyrok" | "przedluzona-do-porodu" | "inna";
export type ArrearsState = "brak" | "do-progu" | "powyzej-progu" | "nie-wiem";

export interface EligibilityFacts {
  applicant: Applicant;
  event: EventKind;
  /** Dzień porodu albo przyjęcia dziecka na wychowanie (ISO). */
  eventDate: string;
  /** Pierwszy dzień okresu, o który chodzi we wniosku; pusty = dzień zdarzenia. */
  periodStart?: string;
  /** Data urodzenia dziecka — przy przyjęciu na wychowanie decyduje o granicy wieku. */
  childBirthDate?: string;
  /** Przysposobienie: wystąpiono do sądu opiekuńczego o przysposobienie. */
  courtFiled?: YesNoUnknown;
  /** Rodzina zastępcza: odroczono obowiązek szkolny (granica 10 lat zamiast 7). */
  schoolDeferred?: boolean;
  title: InsuranceTitle;
  /** Czy w dniu, na który ZUS sprawdza prawo, osoba podlegała ubezpieczeniu chorobowemu. */
  insured: YesNoUnknown;
  /** ZUS wydał decyzję, że osoba nie podlega ubezpieczeniom z tego tytułu (np. umowa dla pozoru). */
  notSubjectDecision?: boolean;
  /** Jak skończyła się umowa o pracę w ciąży (tylko gdy ubezpieczenie ustało przed porodem). */
  employmentEnd?: EmploymentEnd;
  /** Dzień, w którym ustało zatrudnienie (dla zasiłku w wysokości zasiłku macierzyńskiego). */
  employmentEndDate?: string;
  /** Zapewniono inne zatrudnienie po upadłości, likwidacji lub śmierci pracodawcy. */
  otherEmployment?: boolean;
  /** Zadłużenie składkowe w dniu powstania prawa (działalność, współpraca). */
  arrears?: ArrearsState;
  /** Kwota zadłużenia, jeśli znana (zł). */
  arrearsAmount?: number | null;
  /** Dzień spłaty całego zadłużenia, jeśli spłacono. */
  arrearsPaidOn?: string | null;
}

export type EligibilityStatus = "przysluguje" | "nie-przysluguje" | "wstrzymany" | "brak-danych";

export interface EligibilityReason {
  text: string;
  lawIds: EligibilityLawId[];
}

export interface EligibilityResult {
  status: EligibilityStatus;
  /** Jedno zdanie do nagłówka wyniku. */
  summary: string;
  /** Dzień, na który sprawdzono ubezpieczenie. */
  checkedOn: string | null;
  reasons: EligibilityReason[];
  /** Pytanie o brakujący fakt, gdy status = brak-danych. */
  question: string | null;
  /** Kto wypłaci zasiłek, jeśli to wynika z faktów (art. 61). */
  payerNote: string | null;
  rulesVersion: string;
}

const SELF_PAYING: InsuranceTitle[] = ["dzialalnosc", "wspolpracujacy"];
const VOLUNTARY: InsuranceTitle[] = ["zleceniobiorca", "dzialalnosc", "wspolpracujacy"];

const day = (iso: string) => iso.split("-").reverse().join(".");
const pln = (v: number) => `${v.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`;

/** „1 rok”, „3 lata”, „5 lat”, „13 lat”, „22 lata”. */
export function yearsLabel(n: number): string {
  if (n === 1) return "1 rok";
  const tens = n % 100;
  return n % 10 >= 2 && n % 10 <= 4 && (tens < 12 || tens > 14) ? `${n} lata` : `${n} lat`;
}

/** Po „w wieku”: „1 roku”, „3 lat”, „13 lat”. */
export function yearsGenitive(n: number): string {
  return n === 1 ? "1 roku" : `${n} lat`;
}

/** Pełne lata życia dziecka w dniu `on`. */
export function ageInYears(birth: string, on: string): number {
  const [by, bm, bd] = birth.split("-").map(Number);
  const [y, m, d] = on.split("-").map(Number);
  return y - by - (m < bm || (m === bm && d < bd) ? 1 : 0);
}

export function assessMaternityEligibility(facts: EligibilityFacts, today: string, schedule?: RuleSchedule): EligibilityResult {
  const reasons: EligibilityReason[] = [];
  const base = { rulesVersion: ELIGIBILITY_RULES_VERSION, payerNote: null as string | null };
  const result = (status: EligibilityStatus, summary: string, extra: Partial<EligibilityResult> = {}): EligibilityResult => ({
    ...base,
    status,
    summary,
    checkedOn: null,
    reasons,
    question: null,
    ...extra,
  });
  const missing = (question: string) => result("brak-danych", "Brakuje faktu potrzebnego do rozstrzygnięcia.", { question });

  if (facts.periodStart && !isValidIso(facts.periodStart)) return missing("Popraw datę początku okresu z wniosku.");
  // Decyzja o niepodleganiu ubezpieczeniom rozstrzyga sprawę bez względu na daty.
  if (facts.notSubjectDecision) {
    reasons.push({
      text: "ZUS wydał decyzję, że osoba nie podlega ubezpieczeniom społecznym z tego tytułu, np. bo umowę zawarto dla pozoru. Bez ubezpieczenia chorobowego nie ma prawa do zasiłku.",
      lawIds: ["poradnik-9-1", "uz-29-1"],
    });
    return result("nie-przysluguje", "Osoba nie podlegała ubezpieczeniu chorobowemu: decyzja ZUS o niepodleganiu.", { checkedOn: facts.periodStart || facts.eventDate || null });
  }
  // Przy porodzie z podanym początkiem okresu (np. drugi rodzic, wniosek po przerwie) ubezpieczenie
  // sprawdza się na ten dzień, więc data porodu może być nieznana. Przy przyjęciu dziecka decyduje wiek.
  const periodOnly = facts.event === "porod" && Boolean(facts.periodStart);
  if (!periodOnly && (!facts.eventDate || !isValidIso(facts.eventDate))) {
    return missing(facts.event === "porod" ? "Podaj datę porodu." : "Podaj datę przyjęcia dziecka na wychowanie.");
  }
  const checkedOn = facts.periodStart || facts.eventDate;

  // 1. Zdarzenie: kto i z jakiego powodu może mieć prawo (art. 29 ust. 1–2).
  if (facts.event === "rodzina-zastepcza-zawodowa") {
    reasons.push({ text: "Zasiłek macierzyński nie przysługuje przy przyjęciu dziecka w ramach zawodowej rodziny zastępczej.", lawIds: ["uz-29-1"] });
    return result("nie-przysluguje", "Zawodowa rodzina zastępcza nie ma prawa do zasiłku macierzyńskiego.", { checkedOn });
  }
  if (facts.event === "przysposobienie" || facts.event === "rodzina-zastepcza") {
    if (!facts.childBirthDate || !isValidIso(facts.childBirthDate)) return missing("Podaj datę urodzenia przyjętego dziecka.");
    const age = ageInYears(facts.childBirthDate, facts.eventDate);
    if (facts.event === "przysposobienie") {
      if (age >= 14) {
        reasons.push({ text: `Dziecko miało w dniu przyjęcia ${yearsLabel(age)}. Zasiłek przysługuje przy przyjęciu dziecka w wieku do 14 roku życia.`, lawIds: ["uz-29-1", "uz-29-2"] });
        return result("nie-przysluguje", "Dziecko przekroczyło granicę wieku dla przysposobienia.", { checkedOn });
      }
      if (facts.courtFiled === "nie") {
        reasons.push({ text: "Przy przyjęciu dziecka na wychowanie trzeba wystąpić do sądu opiekuńczego o jego przysposobienie.", lawIds: ["uz-29-1", "uz-29-2"] });
        return result("nie-przysluguje", "Nie wystąpiono do sądu o przysposobienie.", { checkedOn });
      }
      if (facts.courtFiled !== "tak") return missing("Czy wystąpiono do sądu opiekuńczego o przysposobienie dziecka?");
      reasons.push({ text: `Przyjęcie dziecka w wieku ${yearsGenitive(age)} i wniosek do sądu o przysposobienie spełniają warunek art. 29.`, lawIds: ["uz-29-1", "uz-29-2"] });
    } else {
      const limit = facts.schoolDeferred ? 10 : 7;
      if (age >= limit) {
        reasons.push({
          text: `Dziecko miało w dniu przyjęcia ${yearsLabel(age)}. W niezawodowej rodzinie zastępczej granica to 7 lat, a przy odroczonym obowiązku szkolnym 10 lat.`,
          lawIds: ["uz-29-1", "uz-29-2"],
        });
        return result("nie-przysluguje", "Dziecko przekroczyło granicę wieku dla rodziny zastępczej.", { checkedOn });
      }
      reasons.push({ text: `Przyjęcie dziecka w wieku ${yearsGenitive(age)} do niezawodowej rodziny zastępczej spełnia warunek art. 29.`, lawIds: ["uz-29-1", "uz-29-2"] });
    }
  }
  if (facts.applicant === "drugi-rodzic") {
    reasons.push({
      text: "Drugi rodzic dostaje zasiłek macierzyński za okres swojego urlopu (np. rodzicielskiego albo ojcowskiego), także gdy matka dziecka nie jest objęta ubezpieczeniem. Ubezpieczenie sprawdza się na początek tego okresu.",
      lawIds: ["uz-29a-1", "uz-29a-2", "uz-31-5"],
    });
  }

  // 2. Ubezpieczenie chorobowe w dniu, na który ZUS sprawdza prawo.
  // Wyjątki z art. 30 dotyczą pracownicy, której ubezpieczenie ustało w ciąży (przed porodem).
  const employee = facts.applicant === "rodzi" && facts.event === "porod" && facts.title === "pracownik";
  const pregnancyEnd = employee && facts.insured !== "tak" ? facts.employmentEnd ?? "brak" : "brak";
  if (pregnancyEnd === "upadlosc-likwidacja" || pregnancyEnd === "smierc-pracodawcy") {
    reasons.push({
      text: "Ubezpieczenie ustało w ciąży wskutek upadłości, likwidacji albo śmierci pracodawcy, więc zasiłek macierzyński przysługuje po porodzie mimo ustania ubezpieczenia.",
      lawIds: ["uz-30-1"],
    });
    if (facts.otherEmployment) {
      reasons.push({ text: "Zapewniono inne zatrudnienie, więc zasiłek w wysokości zasiłku macierzyńskiego do dnia porodu nie przysługuje.", lawIds: ["uz-30-1"] });
    } else {
      const after = facts.employmentEndDate && isValidIso(facts.employmentEndDate) ? ` (zatrudnienie ustało ${day(facts.employmentEndDate)})` : "";
      reasons.push({
        text: `Od ustania zatrudnienia do dnia porodu przysługuje też zasiłek w wysokości zasiłku macierzyńskiego${after}, bo nie zapewniono innego zatrudnienia.`,
        lawIds: ["uz-30-1"],
      });
    }
    return result("przysluguje", "Zasiłek przysługuje mimo ustania ubezpieczenia w ciąży.", {
      checkedOn,
      payerNote: "Za okres po ustaniu ubezpieczenia zasiłek wypłaca ZUS.",
      reasons: [...reasons, { text: "Za okres po ustaniu ubezpieczenia zasiłek wypłaca ZUS.", lawIds: ["uz-61-2"] }],
    });
  }
  if (pregnancyEnd === "naruszenie-prawa-wyrok") {
    reasons.push({
      text: "Umowę rozwiązano w ciąży z naruszeniem prawa, co stwierdził prawomocny wyrok sądu. Zasiłek macierzyński przysługuje po porodzie mimo ustania ubezpieczenia.",
      lawIds: ["uz-30-1"],
    });
    return result("przysluguje", "Zasiłek przysługuje mimo ustania ubezpieczenia w ciąży.", {
      checkedOn,
      payerNote: "Za okres po ustaniu ubezpieczenia zasiłek wypłaca ZUS.",
      reasons: [...reasons, { text: "Za okres po ustaniu ubezpieczenia zasiłek wypłaca ZUS.", lawIds: ["uz-61-2"] }],
    });
  }
  if (pregnancyEnd === "przedluzona-do-porodu") {
    reasons.push({
      text: "Umowę na czas określony przedłużono do dnia porodu, więc zasiłek macierzyński przysługuje także po ustaniu ubezpieczenia.",
      lawIds: ["uz-30-2"],
    });
    return result("przysluguje", "Zasiłek przysługuje także po ustaniu zatrudnienia w dniu porodu.", {
      checkedOn,
      payerNote: "Za okres po ustaniu ubezpieczenia zasiłek wypłaca ZUS.",
      reasons: [...reasons, { text: "Za okres po ustaniu ubezpieczenia zasiłek wypłaca ZUS.", lawIds: ["uz-61-2"] }],
    });
  }

  if (facts.insured === "nie-wiem") return missing(`Czy ${day(checkedOn)} ta osoba podlegała ubezpieczeniu chorobowemu?`);
  if (facts.insured === "nie") {
    const event = facts.event === "porod" ? "urodziła dziecko" : "przyjęła dziecko na wychowanie";
    reasons.push({
      text:
        facts.applicant === "rodzi"
          ? `Zasiłek macierzyński przysługuje, gdy osoba ${event} w okresie ubezpieczenia chorobowego. ${day(checkedOn)} tego ubezpieczenia nie było.`
          : `${day(checkedOn)}, na początek okresu z wniosku, osoba nie podlegała ubezpieczeniu chorobowemu.`,
      lawIds: ["uz-29-1"],
    });
    if (VOLUNTARY.includes(facts.title)) {
      reasons.push({
        text:
          facts.title === "zleceniobiorca"
            ? "Przy umowie zlecenia ubezpieczenie chorobowe jest dobrowolne i trzeba się do niego zgłosić. Nie można zgłosić się do niego wstecz."
            : "Przy działalności (i współpracy przy niej) ubezpieczenie chorobowe jest dobrowolne. Nie można zgłosić się do niego wstecz. W czasie zasiłku macierzyńskiego ZUS wyrejestrowuje z dobrowolnego ubezpieczenia; żeby dalej podlegać, trzeba zgłosić się ponownie.",
        lawIds: facts.title === "zleceniobiorca" ? ["poradnik-10-1"] : ["poradnik-14-1", "poradnik-36-2"],
      });
    }
    if (facts.applicant === "rodzi" && facts.event === "porod" && facts.title === "pracownik" && facts.employmentEnd === "inna") {
      reasons.push({
        text: "Umowa skończyła się przed porodem z innej przyczyny niż upadłość, likwidacja, śmierć pracodawcy, wyrok sądu albo przedłużenie do porodu, więc wyjątki z art. 30 nie mają zastosowania.",
        lawIds: ["uz-30-1", "uz-30-2"],
      });
    }
    return result("nie-przysluguje", "Brak ubezpieczenia chorobowego w dniu, na który ZUS sprawdza prawo.", { checkedOn });
  }

  reasons.push({
    text: `${day(checkedOn)} osoba podlegała ubezpieczeniu chorobowemu.`,
    lawIds: facts.applicant === "rodzi" ? ["uz-29-1"] : ["uz-29a-1"],
  });
  let payerNote: string | null = null;
  if (employee && facts.employmentEnd === "przedluzona-do-porodu") {
    payerNote = "Za okres po ustaniu ubezpieczenia zasiłek wypłaca ZUS.";
    reasons.push({
      text: "Umowę na czas określony przedłużono do dnia porodu, więc po ustaniu zatrudnienia zasiłek macierzyński przysługuje dalej. Za ten okres wypłaca go ZUS.",
      lawIds: ["uz-30-2", "uz-61-2"],
    });
  }

  // 3. Zaległości w składkach osób, które same je opłacają (art. 2a).
  if (SELF_PAYING.includes(facts.title)) {
    const minimumWage = parameterOn(schedule, "wage.minimum", checkedOn).value;
    const threshold = Math.round(minimumWage) / 100;
    const payBy = addMonths(checkedOn, 6);
    const state = facts.arrears ?? "nie-wiem";
    const amount = facts.arrearsAmount ?? null;
    const above = state === "powyzej-progu" || (amount !== null && amount > threshold);
    if (state === "nie-wiem" && amount === null) return missing(`Czy ${day(checkedOn)} na koncie było zadłużenie składkowe wyższe niż ${pln(threshold)} (1% płacy minimalnej)?`);
    if (!above) {
      reasons.push({
        text: `Zadłużenie składkowe w dniu powstania prawa nie przekraczało 1% płacy minimalnej (${pln(threshold)}).`,
        lawIds: ["uz-2a-1"],
      });
    } else {
      const debt = amount !== null ? `Zadłużenie ${pln(amount)}` : "Zadłużenie";
      const paid = facts.arrearsPaidOn && isValidIso(facts.arrearsPaidOn) ? facts.arrearsPaidOn : null;
      if (paid && paid <= payBy) {
        reasons.push({
          text: `${debt} przekraczało ${pln(threshold)}, ale spłacono je ${day(paid)}, przed upływem 6 miesięcy (do ${day(payBy)}). Zasiłek przysługuje po spłacie.`,
          lawIds: ["uz-2a-1", "uz-2a-2"],
        });
      } else if ((paid && paid > payBy) || today > payBy) {
        reasons.push({
          text: `${debt} w dniu powstania prawa (${day(checkedOn)}) przekraczało 1% płacy minimalnej (${pln(threshold)}) i nie spłacono go do ${day(payBy)}. Prawo do zasiłku się przedawniło.`,
          lawIds: ["uz-2a-1", "uz-2a-2"],
        });
        return result("nie-przysluguje", "Zaległość w składkach powyżej 1% płacy minimalnej, niespłacona w 6 miesięcy.", { checkedOn });
      } else {
        reasons.push({
          text: `${debt} przekracza ${pln(threshold)}. Zasiłek nie przysługuje do spłaty całości. Spłata do ${day(payBy)} przywraca prawo, później prawo się przedawnia.`,
          lawIds: ["uz-2a-1", "uz-2a-2"],
        });
        return result("wstrzymany", `Zasiłek wstrzymany do spłaty zadłużenia (najpóźniej do ${day(payBy)}).`, { checkedOn });
      }
    }
  }

  if (SELF_PAYING.includes(facts.title)) {
    payerNote = "Przy działalności i współpracy przy niej zasiłek wypłaca ZUS.";
    reasons.push({ text: payerNote, lawIds: ["uz-61-1"] });
  }
  return result("przysluguje", "Prawo do zasiłku macierzyńskiego przysługuje.", { checkedOn, payerNote });
}
