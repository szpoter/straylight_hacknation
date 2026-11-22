import { isValidIso } from "@/lib/rules/dates";
import type { EvidenceCandidate, LocalCasePage } from "./case-evidence";

export function documentDay(input: string) {
  const iso = input.replace(/^(\d{2})\.(\d{2})\.(\d{4})$/u, "$3-$2-$1");
  return isValidIso(iso) ? iso : undefined;
}

const periodLabel = /^(?:wnioskowany okres(?: zasilku| urlopu)?|okres(?: wnioskowany| zasilku| urlopu)?|wnioskuje za okres)\s*:?\s*(?:od\s+)?(\d{4}-\d{2}-\d{2}|\d{2}\.\d{2}\.\d{4})\s*(?:do|[-–—])\s*(\d{4}-\d{2}-\d{2}|\d{2}\.\d{2}\.\d{4})$/u;
const claimHeading = /^(?:wniosek o (?:wyplate |udzielenie )?zasil(?:ek|ku) macierzynski(?:ego)?|(?:rodzaj (?:swiadczenia|wniosku)|swiadczenie)\s*:\s*zasilek macierzynski)$/u;

export function claimFields(result: LocalCasePage, id: string, lines: string[]) {
  type CodeField = "maternityPayVariant" | "insuranceTitle" | "sicknessCoverage" | "otherCoverage" | "postInsuranceException" | "payrollRegime";
  const dates = (pattern: RegExp) => lines.flatMap((line, i) => {
    const match = pattern.exec(line);
    return match ? [{ match, i }] : [];
  });
  const stated = dates(/^(?:stan (?:na dzien|na)|data poswiadczenia stanu|stan ubezpieczenia na dzien)\s*:\s*(\S+)$/u);
  const asOf = stated.length === 1 ? documentDay(stated[0].match[1]) : undefined;
  const filed = dates(/^data zlozenia(?: wniosku)?\s*:\s*(\S+)$/u);
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
    const split = /^([^:]+)\s*:\s*(.+)$/u.exec(line);
    if (!split) continue;
    const label = split[1].trim();
    const value = split[2].trim();
    if (kind === "application" && /^(?:wybrany )?(?:wariant(?: wyplaty| zasilku)?|stawka zasilku)$/u.test(label)) {
      code(i, "maternityPayVariant", /^(?:100\s*%?\s*[-/–]\s*70\s*%?|100\s*%)$/u.test(value) ? "100-70" : /^81[,.]5\s*%$/u.test(value) ? "815" : undefined);
    }
    if (kind === "certificate" && label === "data porodu") {
      const date = documentDay(value);
      if (date) add(i, "deliveryDate", { kind: "date", date }, { asOf: date });
      else result.reason = "ambiguous_field";
    }
    if (kind === "insurance" || kind === "payroll") {
      if (label === "tytul ubezpieczenia") {
        const titles: Record<string, string> = { pracownik: "employee", "umowa o prace": "employee", zleceniobiorca: "zleceniobiorca", dzialalnosc: "dzialalnosc" };
        code(i, "insuranceTitle", Object.hasOwn(titles, value) ? titles[value] : undefined);
      }
      const count = /^(?:liczba (?:osob )?ubezpieczonych)(?: (?:na dzien|na) (\S+))?$/u.exec(label);
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
