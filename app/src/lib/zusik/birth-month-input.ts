import { parseAmount } from "../plan/benefit-form";
import { isValidIso, MONTHS_GEN } from "../rules/dates";

const months = "styczeń luty marzec kwiecień maj czerwiec lipiec sierpień wrzesień październik listopad grudzień".split(" ");
const thousands = ["jeden", "dwa", "trzy", "cztery", "pięć", "sześć", "siedem", "osiem", "dziewięć"];
const ordinals = "pierwszego drugiego trzeciego czwartego piątego szóstego siódmego ósmego dziewiątego dziesiątego jedenastego dwunastego trzynastego czternastego piętnastego szesnastego siedemnastego osiemnastego dziewiętnastego dwudziestego".split(" ");

export function birthMonthInputs(question: string, asOf: string) {
  const text = question.toLocaleLowerCase("pl").replace(/\s+/gu, " ").trim();
  if (!/81[,.]5\s*(?:%|proc)|osiemdziesięciu jeden i pół procent/u.test(text) ||
      !/100\s*(?:%|proc)|przy stu\b/u.test(text) || /netto|na rękę|na konto|bliźni|wcześniak|szpital|martw|przed porodem/u.test(text)) return null;
  const birth = /(?:urodził[ao] się|urodziłam|poród)\s+(\d{1,2}|[\p{L}]+)(?:\s+([\p{L}]+)(?:\s+(\d{4}))?|\.(\d{1,2})\.(\d{4}))/u.exec(text);
  const requested = /\bza\s+([\p{L}]+)/u.exec(text);
  if (!birth || !requested) return null;
  const month = birth[4] ? Number(birth[4]) - 1 : MONTHS_GEN.indexOf(birth[2]);
  if (month < 0 || months[month] !== requested[1]) return null;
  const day = /^\d+$/u.test(birth[1]) ? Number(birth[1]) : ordinals.indexOf(birth[1]) + 1;
  const date = [birth[5] ?? birth[3] ?? asOf.slice(0, 4), String(month + 1).padStart(2, "0"), String(day).padStart(2, "0")].join("-");
  if (!isValidIso(date)) return null;

  const normalized = text.replace(/(\p{L}+)\s+(?:tysięcy|tysiące|tysiąc)(?=\s+(?:zł|podstaw)|[.?!,]|$)/gu, (term, word) => {
    const digit = thousands.indexOf(word) + 1;
    return digit ? String(digit * 1000) : term;
  });
  const amount = /(?<![\d.,-])(\d+(?: \d{3})*(?:[,.]\d{1,2})?)\s*(?:zł\s*)?podstaw/gu;
  const afterBasis = /podstaw(?:a|ę)(?: wymiaru)?\s*(?:(?:to|wynosi)\s*|[:=]\s*)?(\d+(?: \d{3})*(?:[,.]\d{1,2})?)(?=\s*(?:zł|pln|[.!?]|$))/gu;
  const amounts = [...normalized.matchAll(afterBasis), ...normalized.matchAll(amount)];
  if (amounts.length !== 1) return null;
  const basis = parseAmount(amounts[0][1]);
  return basis && basis > 0 ? { date, basis } : null;
}
