import release from "../../../corpus/opportunities.json";

export type OpportunityFacts = Record<string, string | number | boolean>;
type Condition = { fact: string; evidence: string; equals?: string | boolean; min?: number; max?: number };
type Card = Omit<typeof release.cards[number], "conditions"> & { conditions: Condition[] };
type Catalog = { version: string; reviewedAt: string; questions: Record<string, string>; cards: Card[] };
export type OpportunityInput = { text: string; asOf: string; facts?: OpportunityFacts; fullCatalog?: boolean };

function fold(text: string) {
  return text.toLocaleLowerCase("pl").replaceAll("ł", "l").normalize("NFD").replace(/\p{M}/gu, "");
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
  const day = input.asOf;
  const ranked = catalog.cards.flatMap(card => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !["active", "future"].includes(card.status) ||
        day < (card.validFrom ?? catalog.reviewedAt) || (card.validTo && day > card.validTo)) return [];
    const conditions = card.conditions.map(condition => ({...condition, status: assess(condition, facts)}));
    if (conditions.some(c => c.status === "conflicting")) return [];
    const confirmedFacts = conditions.filter(c => c.status === "confirmed").map(c => c.fact);
    const missingFacts = conditions.filter(c => c.status === "unknown").map(c => c.fact);
    const matchingTerms = card.terms.filter(term => question.includes(fold(term))).length;
    // Age alone is shared by many benefits. Only an event-specific fact can discover a card without topic words.
    const eventMatch = conditions.some(c => c.status === "confirmed" && c.equals !== undefined);
    if (!input.fullCatalog && !matchingTerms && !eventMatch) return [];
    const score = 4 * matchingTerms + Math.min(3, confirmedFacts.length) + Number(eventMatch);
    return [{score, candidate: {id: card.id, title: card.title, reason: card.reason,
      evidence: {corpus: "oferta" as const, fragmentId: card.evidence}, conditions,
      exclusiveGroup: card.exclusiveGroup, conflictEvidence: card.conflictEvidence, missingFacts, confirmedFacts,
      ruleId: card.ruleId, formId: card.formId}}];
  }).sort((a, b) => b.score - a.score);
  const candidates = (input.fullCatalog ? ranked : ranked.slice(0, 3)).map(row => row.candidate);
  const fact = candidates[0]?.missingFacts[0];
  return {catalogVersion: catalog.version, candidates, nextQuestion: fact ? catalog.questions[fact] ?? null : null};
}
