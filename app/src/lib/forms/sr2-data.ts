import { isValidPesel } from "../ocr/identifiers";
import { isValidIso } from "../rules/dates";

type Values = Record<string, string>;
export type SrPerson = { first: string; last: string; id: string; birth?: string; citizen?: string; relation?: string };

export function incomeYear(date: string) {
  return Number(date.slice(0, 4)) - (date.slice(5, 7) >= "11" ? 1 : 2);
}

export function rows(input = ""): string[][] {
  return input.split(/\r?\n/).filter(line => line.trim()).map(line => line.split("|").map(cell => cell.trim()));
}

export function cleanId(id = "") {
  return /^dok:/i.test(id) ? "dok:" + id.slice(4).trim().toUpperCase() : id.replace(/[\s-]/g, "");
}

export const validId = (id: string) => /^dok:\s*\S.+/i.test(id) || isValidPesel(cleanId(id));
const money = /^\d{1,6}([,.]\d{1,2})?$/;

export function srPeople(v: Values) {
  const person = (prefix: string): SrPerson => ({
    first: v[prefix + "_imie"], last: v[prefix + "_nazwisko"],
    id: cleanId(v[prefix + "_pesel"] || (v[prefix + "_dokument"] ? "dok:" + v[prefix + "_dokument"] : "")),
    birth: v[prefix === "dziecko" ? "data_urodzenia" : "rodzic_data"], citizen: v[prefix + "_obywatelstwo"],
  });
  const applicant = person("rodzic");
  const children = [person("dziecko"), ...rows(v.kolejne_dzieci).map(([first, last, id, birth, citizen]) =>
    ({ first, last, id: cleanId(id), birth, citizen }))];
  const family: SrPerson[] = [{ ...applicant, relation: "Wnioskodawca" }];
  if (v.rola !== "Opiekun prawny") family.push(...children.map(child => ({ ...child, relation: "Dziecko" })));
  family.push(...rows(v.rodzina).map(([first, last, id, relation]) => ({ first, last, id: cleanId(id), relation })));
  return { applicant, children, family };
}

export const singleReasons = [
  "Tytuł wykonawczy ustalający alimenty", "Akt zgonu drugiego rodzica", "Odpis zupełny aktu urodzenia (ojciec nieznany)",
  "Wyrok oddalający powództwo o alimenty", "Orzeczenie o całkowitym utrzymaniu dziecka przez jednego rodzica",
  "Orzeczenie o opiece naprzemiennej", "Brak tytułu i wyjątku",
];

export function srErrors(v: Values, today: string) {
  const errors: Values = {};
  for (const prefix of ["rodzic", "dziecko"]) {
    if (!v[prefix + "_pesel"]?.trim() && !v[prefix + "_dokument"]?.trim()) errors[prefix + "_dokument"] = "Wpisz PESEL albo serię i numer dokumentu.";
    if (v[prefix + "_pesel"]?.trim() && v[prefix + "_dokument"]?.trim()) errors[prefix + "_dokument"] = "Dokument wpisuje się tylko przy braku numeru PESEL.";
  }
  const { family, children } = srPeople(v);
  const familyIds = new Set(family.map(person => person.id));
  if (rows(v.kolejne_dzieci).some(row => row.length !== 5 || row.some(cell => !cell) || !validId(row[2]) || !isValidIso(row[3]) || row[3] > today)) errors.kolejne_dzieci = "Sprawdź pięć danych każdego dziecka, identyfikator i datę urodzenia.";
  if (new Set(children.map(c => c.id)).size !== children.length) errors.kolejne_dzieci = "Każde dziecko wpisz tylko raz.";
  if (rows(v.rodzina).some(row => row.length !== 4 || row.some(cell => !cell) || !validId(row[2]))) errors.rodzina = "Każda osoba wymaga imienia, nazwiska, PESEL lub dokumentu i pokrewieństwa.";
  if (familyIds.size !== family.length && family.every(p => p.id)) errors.rodzina = "Każdego członka rodziny wpisz tylko raz.";
  for (const prefix of ["urzad", "adres"]) if (v[prefix + "_kod"] && !/^\d{2}-?\d{3}$/.test(v[prefix + "_kod"].trim())) errors[prefix + "_kod"] = "Wpisz kod pocztowy, np. 00-001.";
  if (v.rola === "Rodzic biologiczny" && v.zaswiadczenie === "Nie") errors.zaswiadczenie = "Dołącz zaświadczenie lekarza lub położnej o opiece od najpóźniej 10. tygodnia ciąży do porodu.";
  if (v.samotnie === "Tak" && v.alimenty_tytul === singleReasons.at(-1)) errors.alimenty_tytul = "Potrzebny jest tytuł alimentacyjny lub dokument jednego z wyjątków.";
  if (v.alimenty && !money.test(v.alimenty.trim())) errors.alimenty = "Podaj kwotę w złotych i groszach mieszczącą się w druku (do 999999,99).";
  for (const [flag, field] of [["nieopodatkowane", "dochody_osoby"], ["rolne", "hektary_osoby"]]) {
    if (v[flag] !== "Tak") continue;
    const entries = rows(v[field]);
    const farm = flag === "rolne";
    for (const entry of entries) {
      const id = cleanId(entry[0]);
      const amount = entry.at(-1) ?? "";
      if (!familyIds.has(id) || entry.length !== (farm ? 2 : 3) || entry.some(cell => !cell) || !(farm ? /^\d{1,4}([,.]\d{1,4})?$/ : money).test(amount)) {
        errors[field] = "Sprawdź układ wiersza, kwotę lub powierzchnię oraz identyfikator osoby ze składu rodziny.";
      }
    }
    const ids = entries.map(row => cleanId(row[0]));
    if (farm && new Set(ids).size < ids.length) errors[field] = "Podaj jedną łączną powierzchnię na osobę.";
    if (!farm) {
      const totals = new Map<string, number>();
      for (const [id, , amount] of entries) {
        const key = cleanId(id);
        const total = (totals.get(key) ?? 0) + Math.round(Number(amount?.replace(",", ".")) * 100);
        if (total > 99_999_999) errors[field] = "Suma dochodów osoby przekracza sześć miejsc na złote we wzorze ZSR-05. Uzgodnij sposób wykazania jej z gminą.";
        totals.set(key, total);
      }
    }
  }
  return errors;
}
