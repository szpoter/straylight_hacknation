import { isValidIso, MONTHS_GEN } from "@/lib/rules/dates";
import type { EvidenceCandidate, LocalCasePage } from "./case-evidence";

export function documentDay(input: string) {
  const text = input.trim().replace(/\s*r\.?$/iu, "").trim();
  const parts = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/u.exec(text);
  const words = /^(\d{1,2})\s+([a-ząćęłńóśźż]+)\s+(\d{4})$/iu.exec(text);
  const fold = (v: string) => v.normalize("NFD").replace(/\p{M}/gu, "").replace(/ł/giu, "l").toLowerCase();
  const month = words ? MONTHS_GEN.findIndex(m => fold(m) === fold(words[2])) + 1 : 0;
  const iso = parts ? `${parts[3]}-${parts[2].padStart(2,"0")}-${parts[1].padStart(2,"0")}` :
    words && month ? `${words[3]}-${String(month).padStart(2,"0")}-${words[1].padStart(2,"0")}` : text;
  return isValidIso(iso) ? iso : undefined;
}

export function documentMoney(text: string) {
  const match = /^(\d+|\d{1,3}(?:[ \u00a0]\d{3})+)(?:,(\d{2}))?(?:\s*(?:zl|pln))?$/u.exec(text);
  if (!match) return;
  const grosze = Number(match[1].replace(/\s/gu, "")) * 100 + Number(match[2] ?? 0);
  if (Number.isSafeInteger(grosze)) return { kind: "money", currency: "PLN", grosze } as const;
}

export const documentDayPattern = "(?:\\d{4}-\\d{2}-\\d{2}|\\d{1,2}[./-]\\d{1,2}[./-]\\d{4}|\\d{1,2}\\s+[a-z]{3,15}\\s+\\d{4})(?:\\s*r\\.?)?";
const periodLabel = new RegExp(String.raw`^(?:wnioskowany okres(?: zasilku| urlopu)?|okres(?: wnioskowany| zasilku| urlopu)?|wnioskuje za okres)\s*:?\s*(?:od\s+)?(${documentDayPattern})\s*(?:do|[-–—])\s*(${documentDayPattern})$`, "u");
// Accept a checkbox group only when exactly one printed option is positively marked.
function selectedOption(value: string) {
  const options = Array.from(value.matchAll(/(?:\[([ x]?)\]|([☒☑☐]))\s*([^☒☑☐[\]]+)/gu));
  if (!options.length) return value;
  if (options.map(m => m[0]).join("").trim() !== value || options.some(m => !m[3].trim())) return "";
  const marked = options.filter(m => m[1] === "x" || m[2] === "☒" || m[2] === "☑");
  return marked.length === 1 ? marked[0][3].trim() : "";
}

const claimHeading = /^(?:wniosek o (?:wyplate |udzielenie )?zasil(?:ek|ku) macierzynski(?:ego)?|(?:rodzaj (?:swiadczenia|wniosku)|swiadczenie)\s*:\s*zasilek macierzynski)$/u;

export function claimFields(result: LocalCasePage, id: string, lines: string[]) {
  type CodeField = "maternityPayVariant" | "insuranceTitle" | "sicknessCoverage" | "otherCoverage" | "postInsuranceException" | "payrollRegime";
  const dates = (pattern: RegExp) => lines.flatMap((line, i) => {
    const match = pattern.exec(line);
    return match ? [{ match, i }] : [];
  });
  const stated = dates(/^(?:stan (?:na dzien|na)|data poswiadczenia stanu|stan ubezpieczenia na dzien)\s*:\s*(.+)$/u);
  const asOf = stated.length === 1 ? documentDay(stated[0].match[1]) : undefined;
  const delivery = dates(/^data porodu\s*:\s*(.+)$/u);
  const eventDay = delivery.length === 1 ? documentDay(delivery[0].match[1]) : undefined;
  const filed = dates(/^data zlozenia(?: wniosku)?\s*:\s*(.+)$/u);
  const filedDay = filed.length === 1 ? documentDay(filed[0].match[1]) : undefined;
  const intervals = dates(periodLabel);
  const period = intervals.length === 1 ? intervals[0] : undefined;
  const from = period && documentDay(period.match[1]);
  const to = period && documentDay(period.match[2]);
  const valid = Boolean(from && to && from <= to);
  function add(index: number, field: EvidenceCandidate["field"], value: EvidenceCandidate["value"], scope: Pick<EvidenceCandidate, "asOf" | "validFrom" | "validTo">, related: number[] = []) {
    const bounds = [index, ...related];
    result.candidates.push({ field, value, ...scope, locator: { clientDocumentId: id, page: result.page,
      lineStart: Math.min(...bounds) + 1, lineEnd: Math.max(...bounds) + 1 } });
  }
  function code(index: number, field: CodeField, value: string | undefined) {
    if (!value) { result.reason = "ambiguous_field"; return; }
    if (field === "maternityPayVariant" && valid && period) {
      add(index, field, { kind: "code", code: value }, { validFrom: from, validTo: to }, [period.i]);
    } else {
      add(index, field, { kind: "code", code: value }, { asOf }, asOf ? [stated[0].i] : []);
    }
  }
  for (const [i, line] of lines.entries()) {
    const { kind } = result;
    if (kind === "application" && claimHeading.test(line)) {
      if (valid && period && (!filed.length || filedDay)) {
        add(i, "benefitRequest", { kind: "code", code: "maternity" }, { validFrom: from, validTo: to, asOf: filedDay },
          filedDay ? [period.i, filed[0].i] : [period.i]);
      } else result.reason = "ambiguous_field";
    }
    const split = /^([^:]+)\s*:\s*(.*)$/u.exec(line);
    if (!split) continue;
    const label = split[1].trim();
    const value = selectedOption(split[2].trim());
    if (kind === "application" && /^(?:wybrany )?(?:wariant(?: wyplaty| zasilku)?|stawka zasilku)$/u.test(label)) {
      code(i, "maternityPayVariant", /^(?:100\s*%?\s*[-/–]\s*70\s*%?|100\s*%)$/u.test(value) ? "100-70" : /^81[,.]5\s*%$/u.test(value) ? "815" : undefined);
    }
    if (kind === "certificate" && label === "data porodu") {
      const date = documentDay(value);
      if (date) add(i, "deliveryDate", { kind: "date", date }, { asOf: date });
      else result.reason = "ambiguous_field";
    }
    const courseDocument = kind === "certificate" || kind === "application";
    let event: Pick<EvidenceCandidate, "field" | "value"> | undefined;
    if (kind === "certificate" && /^(?:liczba dzieci (?:z tego porodu|urodzonych (?:w|przy) tym porodzie))$/u.test(label)) {
      if (/^[1-9]\d?$/u.test(value)) event = { field: "birthChildCount", value: { kind: "count", count: Number(value) } };
      else result.reason = "ambiguous_field";
    }
    if (courseDocument && /^(?:liczba dni urlopu macierzynskiego (?:wykorzystanych )?przed porodem|dni urlopu macierzynskiego przed porodem)$/u.test(label)) {
      if (/^\d{1,2}$/u.test(value) && Number(value) <= 42) event = { field: "prenatalLeaveDays", value: { kind: "count", count: Number(value) } };
      else result.reason = "ambiguous_field";
    }
    if (courseDocument && label === "przebieg urlopu macierzynskiego") {
      const courses: Record<string, string> = {
        "bez przerw i bez przejecia urlopu": "ordinary_uninterrupted",
        "urodzenie martwe jedynego dziecka z tego porodu": "single_stillbirth",
        "zgon jedynego dziecka z tego porodu": "single_child_death",
      };
      if (Object.hasOwn(courses, value)) event = { field: "maternityCourse", value: { kind: "code", code: courses[value] } };
      else result.reason = "ambiguous_field";
    }
    if (kind === "certificate" && label === "data zgonu dziecka") {
      const date = documentDay(value);
      if (date && (!eventDay || date >= eventDay)) event = { field: "childDeathDate", value: { kind: "date", date } };
      else result.reason = "ambiguous_field";
    }
    if (event) {
      const day = eventDay ?? asOf;
      const related = eventDay ? delivery[0].i : asOf ? stated[0].i : undefined;
      if (day && related !== undefined) add(i, event.field, event.value, { asOf: day }, [related]);
      else result.reason = "ambiguous_field";
    }
    if (kind === "insurance" && /^(?:saldo zadluzenia skladkowego|zadluzenie z tytulu skladek)$/u.test(label)) {
      const amount = documentMoney(value);
      if (amount && asOf) add(i, "accountArrears", amount, { asOf }, [stated[0].i]);
      else result.reason = "ambiguous_field";
    }
    if (kind === "insurance" && label === "data pelnej splaty zadluzenia") {
      const date = documentDay(value);
      if (date && asOf && date <= asOf) add(i, "debtSettlement", { kind: "code", code: date }, { asOf }, [stated[0].i]);
      else result.reason = "ambiguous_field";
    }
    if (kind === "insurance" && label === "stan splaty zadluzenia") {
      if (asOf && value === "niesplacone") add(i, "debtSettlement", { kind: "code", code: "unpaid" }, { asOf }, [stated[0].i]);
      else result.reason = "ambiguous_field";
    }
    if (kind === "insurance" || kind === "payroll") {
      if (label === "tytul ubezpieczenia") {
        const titles: Record<string, string> = { pracownik: "employee", "umowa o prace": "employee", zleceniobiorca: "zleceniobiorca", dzialalnosc: "dzialalnosc" };
        code(i, "insuranceTitle", Object.hasOwn(titles, value) ? titles[value] : undefined);
      }
      const count = /^(?:liczba (?:osob )?ubezpieczonych)(?: (?:na dzien|na) (.+))?$/u.exec(label);
      if (count) {
        const day = count[1] ? documentDay(count[1]) : asOf;
        if (day && /^\d{1,8}$/u.test(value)) add(i, "payerInsuredCount", { kind: "count", count: Number(value) }, { asOf: day },
          !count[1] && asOf ? [stated[0].i] : []);
        else result.reason = "ambiguous_field";
      }
    }
    if (kind === "insurance" && /^(?:ubezpieczenie chorobowe|podleganie ubezpieczeniu chorobowemu)$/u.test(label)) {
      const included = /^(?:tak|podlega|objeta|objety|podlega ubezpieczeniu chorobowemu)$/u.test(value);
      const excluded = /^(?:nie|nie podlega|brak ubezpieczenia|nie podlega ubezpieczeniu chorobowemu)$/u.test(value);
      code(i, "sicknessCoverage", included ? "covered" : excluded ? "excluded" : undefined);
    }
    if (kind === "insurance" && /^(?:inne|pozostale) tytuly(?: ubezpieczenia(?: chorobowego)?)?$/u.test(label)) {
      code(i, "otherCoverage", /^(?:brak|brak innych tytulow|nie wystepuja)$/u.test(value) ? "none" : undefined);
    }
    if ((kind === "insurance" || kind === "certificate") && /^(?:wyjatki|przeslanki (?:do prawa|uprawnienia)) po ustaniu ubezpieczenia$/u.test(label)) {
      code(i, "postInsuranceException", /^(?:brak|nie wystepuja|wykluczono)$/u.test(value) ? "none" : undefined);
    }
    if (kind === "payroll" && /^(?:warunki wynagrodzenia|charakter wynagrodzenia|warunki zatrudnienia)$/u.test(label)) {
      const full = /^pelny etat[,;] (?:stale wynagrodzenie|wynagrodzenie stale)[,;] (?:pelne miesiace|pelne miesiace kalendarzowe)$/u.test(value);
      code(i, "payrollRegime", full ? "full_time_fixed_full_months" : undefined);
    }
  }
}
