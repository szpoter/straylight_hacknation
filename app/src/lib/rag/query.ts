/**
 * Question handling before any external call:
 * - privacy: names from the fictional profile, identifiers and contacts are replaced by roles;
 * - scope gates: questions this corpus can never answer (amounts) or that need one clarification;
 * - search expansion: parent vocabulary → official vocabulary (calibrated on corpus/marta/calibration.json);
 * - explicit locators ("art. 182¹d § 1", "§ 22") for exact lookup.
 */

/** Fictional demo profile (TECH-SPEC-AGENT.md): Marta and Paweł Lis, daughter Ola, employer Studio Lipa. */
const END = "(?![\\p{L}])";
const word = (stem: string) => new RegExp(`(?<![\\p{L}])${stem}${END}`, "gu");
const PROFILE_REPLACEMENTS: Array<[RegExp, string]> = [
  [word("Paweł"), "drugi rodzic"],
  [word("Pawła"), "drugiego rodzica"],
  [word("Pawłowi"), "drugiemu rodzicowi"],
  [word("Pawłem"), "drugim rodzicem"],
  [word("Pawle"), "drugim rodzicu"],
  [word("Mart(?:a|y|ą|ę|o|cie)"), ""],
  [word("Oli"), "dziecka"],
  [word("Olą"), "dzieckiem"],
  [word("O(?:la|lę|lu)"), "dziecko"],
  [word("Studi(?:o|a|u|em) Lip(?:a|y|ie|ą)"), "pracodawca"],
  [word("Lis(?:a|owi|em|ie|ów|om)?"), ""],
];

const IDENTIFIER_REPLACEMENTS: Array<[RegExp, string]> = [
  [/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[e-mail]"],
  [/\bPL\d{26}\b|\b\d{2}(?: ?\d{4}){6}\b/g, "[rachunek]"],
  [/\b\d{11}\b/g, "[numer]"],
  [/\+?\d[\d -]{7,}\d/g, "[numer]"],
];

export const MAX_QUESTION_LENGTH = 500;

/** Text that may leave the backend (Qdrant, Sherlock). Keeps intent, drops who. */
export function sanitizeQuestion(question: string): string {
  let text = question.normalize("NFC");
  for (const [pattern, replacement] of IDENTIFIER_REPLACEMENTS) text = text.replace(pattern, replacement);
  for (const [pattern, replacement] of PROFILE_REPLACEMENTS) text = text.replace(pattern, replacement);
  return text.replace(/\s+([,.?!])/g, "$1").replace(/\s+/g, " ").trim();
}

export type ScopeGate =
  | { kind: "amount"; message: string }
  | { kind: "clarify"; message: string }
  | null;

export const AMOUNT_MESSAGE =
  "Te źródła nie wystarczają do wyliczenia Waszej wypłaty. Brak podstawy w tych materiałach nie oznacza, że świadczenie Wam nie przysługuje.";
export const BENEFIT_800_MESSAGE =
  "W tych źródłach nie ma podstawy do odpowiedzi o świadczeniu 800+. To nie przesądza, czy Ci przysługuje.";
export const PURPOSE_QUESTION = "Pytasz o wniosek o urlop do pracodawcy czy o wypłatę zasiłku?";

const AMOUNT_PATTERNS = [
  /\bna kont/i,
  /\bnetto\b|\bbrutto\b/i,
  /\bkwot/i,
  /(?<![\p{L}])ile(?![\p{L}]).{0,40}(dostan|wynies|wypłac|zarobi|pieni)/iu,
  /wysoko[sś][cć].{0,20}(zasiłk|wypłat|świadcz)/iu,
  /(?<![\p{L}])(zł|złotych|PLN)(?![\p{L}])/iu,
];
const BENEFIT_800 = /\b800\s*(\+|plus)/i;
const VAGUE_SEND = /^(a\s+)?(co|jakie\s+\S+)\s+(trzeba|mam|muszę|należy)\s+(wysłać|złożyć|przesłać|dostarczyć|wypełnić)\s*\??$/i;

export function scopeGate(question: string): ScopeGate {
  const q = question.trim();
  if (BENEFIT_800.test(q)) return { kind: "amount", message: BENEFIT_800_MESSAGE };
  if (AMOUNT_PATTERNS.some((p) => p.test(q))) return { kind: "amount", message: AMOUNT_MESSAGE };
  if (VAGUE_SEND.test(q)) return { kind: "clarify", message: PURPOSE_QUESTION };
  return null;
}

/** Parent wording → official wording. Calibrated on calibration.json, never on eval.json. */
const EXPANSIONS: Array<[RegExp, string]> = [
  [/kadr|szef|firm/i, "pracodawca"],
  [/oboje|razem|w tym samym|w tych samych|ten sam|wspólnie|naraz|jednocze|równocze|we dwoje/i, "oboje pracownicy rodzice jednocześnie korzystają z urlopu rodzicielskiego, łączny wymiar"],
  [/odpis|akt(u)? urodzenia|dokument dziecka/i, "odpis skrócony aktu urodzenia dziecka dołącza się do wniosku; dokumenty w aktach osobowych pracownika"],
  [/drugi rodzic|drugim rodzic|m[ąę]ż|żon|partner|\bon (też|wtedy|w tym)|ojc|tat/i, "oświadczenie pracownika o okresie, w którym drugi z rodziców zamierza korzystać z urlopu rodzicielskiego"],
  [/oddać|przekaz|przenie|oddam|zarezerwowan|tylko dla/i, "wyłączne prawo do 9 tygodni urlopu rodzicielskiego, nie można przenieść na drugiego rodzica"],
  [/kawał|czę[sś]c|podziel/i, "urlop rodzicielski udzielany w nie więcej niż 5 częściach"],
  [/elektroniczn|mail|online|przez internet/i, "wniosek w postaci papierowej lub elektronicznej"],
  [/najpóźniej|ile wcze[sś]niej|kiedy (złoży|napisa|wysła)|termin|na czas/i, "wniosek składany w terminie nie krótszym niż 21 dni przed rozpoczęciem korzystania z urlopu"],
  [/odmówi|odmowa|zgod/i, "pracodawca jest obowiązany uwzględnić wniosek pracownika"],
  [/do kiedy|wiek dziecka|ile lat/i, "do zakończenia roku kalendarzowego, w którym dziecko kończy 6 rok życia"],
  [/zasił/i, "zasiłek macierzyński za okres odpowiadający okresowi urlopu rodzicielskiego"],
];

export function expandQuery(sanitized: string): string | null {
  const extra = EXPANSIONS.filter(([pattern]) => pattern.test(sanitized)).map(([, text]) => text);
  return extra.length ? `${sanitized}\n${extra.join("; ")}` : null;
}

/** Locator keys named explicitly in the question, matching Fragment.locatorKeys. */
export function explicitLocatorKeys(question: string): string[] {
  const keys = new Set<string>();
  const art = /art\.?\s*182\s*(?:\[1([a-g])\]|(?:\^|¹|1)?\s*([a-g])(?![\p{L}]))(?:\s*§\s*(\d+))?/giu;
  let match: RegExpExecArray | null;
  let sawArticle = false;
  while ((match = art.exec(question))) {
    sawArticle = true;
    const base = `art182^1${(match[1] ?? match[2]).toLowerCase()}`;
    keys.add(match[3] ? `${base}§${match[3]}` : base);
  }
  if (!sawArticle) {
    const par = /§\s*(\d+)(?:\s*ust\.?\s*(\d+))?(?:\s*pkt\.?\s*(\d+))?/gi;
    while ((match = par.exec(question))) {
      keys.add(`§${match[1]}${match[2] ? `ust${match[2]}` : ""}${match[3] ? `pkt${match[3]}` : ""}`);
    }
  }
  return [...keys];
}

/**
 * Topics that stay out of the evidence unless the question is about them.
 * Combining leave with work has its own 21-day request; it must not answer a plain leave request.
 */
const WORK_COMBINATION = /pół etatu|etat|łącz|pracować|pracuj|wrócić do pracy|podjąć pracę|niepełnym wymiarze/i;

export function excludedTopics(question: string): string[] {
  return WORK_COMBINATION.test(question) ? [] : ["work_combination"];
}
