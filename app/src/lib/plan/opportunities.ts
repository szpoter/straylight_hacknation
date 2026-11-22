import release from "../../../corpus/opportunities.json";

export type OpportunityFacts = Record<string, string | number | boolean>;
type Condition = { fact: string; evidence: string; equals?: string | boolean; min?: number; max?: number };
type Card = Omit<typeof release.cards[number], "conditions"> & { conditions: Condition[] };
type Catalog = { version: string; reviewedAt: string; questions: Record<string, string>; cards: Card[] };
export type OpportunityInput = { text: string; asOf: string; facts?: OpportunityFacts; fullCatalog?: boolean };

function fold(text: string) {
  return text.toLocaleLowerCase("pl").replaceAll("ł", "l").normalize("NFD").replace(/\p{M}/gu, "");
}

export const catalogPrompt = "Pokaż pełny katalog świadczeń.";
export const cardPrefix = "Pokaż możliwości wsparcia: ";

/** Only catalogue titles cross the browser boundary, even for free-form family stories. */
export function opportunityQuestion(text: string, asOf = new Date().toISOString().slice(0, 10)): string | null {
  const q = fold(text);
  if (/(?<!\d)(?:19|20)\d{2}(?!\d)|kiedys|dawniej|przed laty|(?:zeszl|ubiegl)\w* (?:roku|miesiacu)|sprzed lat/u.test(q)) return null;
  if (/(?:cal[aye]|peln[yae]|wszystkie)\s+(?:katalog|list|ofert|program|mozliwos|swiadczeni)/u.test(q)) return catalogPrompt;
  const discovery = /co (?:warto|sprawdzic|mog[eaz]|mozemy|mozna|mi przysluguje|nam przysluguje)|co (?:mi|nam) sie nalezy|z czego (?:moz|skorzyst)|na co zwrocic uwage|(?:jakie|jaka|jakiego) (?:sa |mam |mamy )?(?:mozliwos|opcje|wsparci|pomoc|swiadczeni|program)|porownaj.{0,30}(?:plan|wariant|opcj)|nie wiem.{0,20}zapytac/u.test(q);
  const detail = /\b(?:ile|kiedy|kto|komu|gdzie|ktory|ktora|jak dlugo|czy)\b|\bjak (?:moge|sprawdzic|zlozyc)|kwot|formul|wniosk|termin|dokument|zalacznik|staw[kc]|procent|na czyje konto/u.test(q);
  if (detail) return null;
  const familyStory = /babci|dziadk|niani|noworod|wczesniak|inkubator|dziec|cork|\bsyn|dwulat|maluch|urodzil|zlob|przedszkol|podstawow/u.test(q);
  if (!discovery && (!familyStory || q.includes("?"))) return null;
  const { candidates } = listOpportunities({ text, asOf });
  return candidates.length ? cardPrefix + candidates.map(c => c.title).join(", ") : null;
}

function assess(condition: Condition, facts: OpportunityFacts): "confirmed" | "conflicting" | "unknown" {
  if (!Object.hasOwn(facts, condition.fact)) return "unknown";
  const value = facts[condition.fact];
  if (condition.equals !== undefined) return value === condition.equals ? "confirmed" : "conflicting";
  if (condition.min !== undefined || condition.max !== undefined) {
    if (typeof value !== "number" || !Number.isFinite(value)) return "unknown";
    return value >= (condition.min ?? -Infinity) && value <= (condition.max ?? Infinity) ? "confirmed" : "conflicting";
  }
  return typeof value === "string" && !value.trim() ? "unknown" : "confirmed";
}

/** Only confirmed facts from the active case belong here. Text ranks topics locally. */
export function listOpportunities(input: OpportunityInput, catalog: Catalog = release) {
  const facts = input.facts ?? {};
  const question = fold(input.text);
  const titles = input.text.startsWith(cardPrefix) ? input.text.slice(cardPrefix.length).split(", ") : null;
  const day = input.asOf;
  const ranked = catalog.cards.flatMap(card => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !["active", "future"].includes(card.status) ||
        day < (card.validFrom ?? catalog.reviewedAt) || (card.validTo && day > card.validTo)) return [];
    const conditions = card.conditions.map(condition => ({...condition, status: assess(condition, facts)}));
    if (conditions.some(c => c.status === "conflicting")) return [];
    const confirmedFacts = conditions.filter(c => c.status === "confirmed").map(c => c.fact);
    const missingFacts = conditions.filter(c => c.status === "unknown").map(c => c.fact);
    if (titles && !titles.includes(card.title)) return [];
    const matchingTerms = titles ? titles.length - titles.indexOf(card.title) :
      new Set(card.terms.map(fold).filter(term => question.includes(term))).size;
    // Age alone is shared by many benefits. Only an event-specific fact can discover a card without topic words.
    const eventMatch = conditions.some(c => c.status === "confirmed" && c.equals !== undefined);
    if (!input.fullCatalog && !matchingTerms && !eventMatch) return [];
    // Closing the nursery or a newborn's hospital stay is more specific than the setting itself.
    const specificEvent = !titles && matchingTerms && (card.id === "opieka-zamkniecie" ||
      (card.id === "uzupelniajacy-macierzynski" && /urodz|porod|noworod|wczesni|przedwczes/u.test(question)));
    const score = 4 * matchingTerms + Math.min(3, confirmedFacts.length) + Number(eventMatch) + (specificEvent ? 8 : 0);
    return [{score, candidate: {id: card.id, title: card.title, reason: card.reason,
      evidence: {corpus: "oferta" as const, fragmentId: card.evidence}, conditions,
      exclusiveGroup: card.exclusiveGroup, conflictEvidence: card.conflictEvidence, missingFacts, confirmedFacts,
      ruleId: card.ruleId, formId: card.formId}}];
  }).sort((a, b) => b.score - a.score);
  const candidates = (input.fullCatalog ? ranked : ranked.slice(0, 3)).map(row => row.candidate);
  const fact = candidates[0]?.missingFacts[0];
  return {catalogVersion: catalog.version, candidates, nextQuestion: fact ? catalog.questions[fact] ?? null : null};
}
