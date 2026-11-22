import { z } from "zod";
import { localPublicRanking } from "./local-public-ranking";
import { asksAboutOwnEligibility, asksOutsideBenefitScope, isPublicLegalDetail, publicBenefitFocus, publicQuestion, type PublicQuestion } from "./public-query";
import { MAX_QUESTION_LENGTH, scopeGate } from "./query";

const labels = {
  info: "Co wynika z publikacji", entitlement: "Jakie są warunki świadczenia",
  duration: "Jak długo trwa okres", deadline: "Jaki termin obowiązuje",
  documents: "Jakie dokumenty są potrzebne", payer: "Kto wypłaca świadczenie",
  proof: "Jak potwierdzić okoliczność", recipient: "Kto otrzymuje świadczenie",
  rate: "Jaki procent podstawy obowiązuje",
} as const;

const aspects = Object.keys(labels) as [keyof typeof labels, ...(keyof typeof labels)[]];
export const publicLookupSchema = z.strictObject({
  ids: z.array(z.string().regex(/^[a-z0-9-]{1,100}$/u)).min(1).max(5),
  facet: z.enum(aspects),
  rankingOnly: z.literal(true).optional(),
  terms: z.array(z.string().regex(/^[a-ząćęłńóśźż]{4,45}$/u)).min(2).max(8),
});
export type PublicLookup = z.infer<typeof publicLookupSchema>;
export const publicLookupTitle = (lookup: PublicLookup) => labels[lookup.facet] + " („" + lookup.terms.join(", ") + "”)?";

/** Only idempotent public projections can serve as the fallback accompanying a ranking. */
export function isReviewedProjection(question: string) {
  const reviewed = publicQuestion(question, true);
  return !!reviewed && !reviewed.clarify && reviewed.question === question;
}

function requestedFacet(text: string): PublicLookup["facet"] {
  if (/procent|staw[kc]|%/iu.test(text)) return "rate";
  if (/jak długo|ile (?:dni|tygodni|miesięcy)|na jaki okres|limit.{0,20}(?:dni|okres)/iu.test(text)) return "duration";
  if (/termin|do kiedy|wyprzedzeniem|ile wcześniej/iu.test(text)) return "deadline";
  if (/kto.{0,35}(?:wypłaca|płaci)|płatnikiem/iu.test(text)) return "payer";
  if (/komu.{0,35}wypłaca|na czyje konto/iu.test(text)) return "recipient";
  if (/potwierdz|udowod|stwierdz|jak wykaza|orzeczeni|dowodem/iu.test(text)) return "proof";
  if (/dokument|załącznik|dołączyć/iu.test(text)) return "documents";
  if (/przysługuje|uprawnia|prawo do/iu.test(text)) return "entitlement";
  return "info";
}

/** Compute locally before replacing the question with a public template. Only source words leave the client. */
export function rankedLookup(raw: string, direct: PublicQuestion | null): PublicLookup | null {
  if (raw.length > MAX_QUESTION_LENGTH || asksAboutOwnEligibility(raw) || asksOutsideBenefitScope(raw) ||
      scopeGate(raw.replace(/800\s*(?:\+|plus)/giu, "")) || /\d{4}|@|https?:|aliment|kredyt|moj(?:ą|ej|ego)|w moim/iu.test(raw)) return null;
  if ((direct?.corpus === "oferta" && direct.clarify) || direct?.requiredFragmentIds?.length || direct?.question === raw || direct?.question.startsWith("Pytania publiczne:") ||
      direct?.question.startsWith("Co stanowi art.") || isPublicLegalDetail(raw) || isPublicLegalDetail(direct?.question ?? "") ||
      /\s(?:lub|albo|oraz|i)\s+(?:jak|czy|kto|ile|kiedy|do kiedy|w jaki)/iu.test(raw) ||
      (direct?.clarify && /(?:^|\s)(?:nie|bez|ani|brak\p{L}*|żad\p{L}*|nieodpłat\p{L}*)(?!\p{L})/iu.test(raw))) return null;
  const subject = publicBenefitFocus(raw);
  if (subject.length > 1) return null;
  const facet = requestedFacet(raw);
  const ranked = localPublicRanking(raw);
  const suitable = ranked.filter(hit => {
    const names = publicBenefitFocus(hit.subjectText);
    return (facet === "info" || hit.facets.some(f => f === facet)) &&
      (!subject.length || !names.length || names.includes(subject[0])) && hit.words.length >= 2;
  });
  const selected = (subject.length && suitable.find(hit => publicBenefitFocus(hit.subjectText).includes(subject[0]))) || suitable[0];
  if (!selected || selected.score < 8) return null;
  const namedSubject = subject.length === 1 && publicBenefitFocus(selected.subjectText).includes(subject[0]);
  // Extra narrative lowers whole-question coverage. A named subject and an independently matched aspect
  // can still identify the provision, provided there are at least three matching source words.
  const confident = selected.coverage >= 0.55 || (namedSubject && facet !== "info" && selected.words.length >= 3);
  const fallback = direct?.question && !direct.clarify && isReviewedProjection(direct.question);
  if (!confident && !fallback) return null;
  const rankingOnly = !confident || (fallback && localPublicRanking(direct.question).slice(0, 3).some(hit => hit.id === selected.id));
  const words = selected.words.map(w => w.toLowerCase()).filter(w => /^[a-ząćęłńóśźż]{4,45}$/u.test(w)).slice(0, 8);
  if (words.length < 2) return null;
  return {facet, terms:words, ids:[selected.id, ...ranked.filter(h => h.id !== selected.id).slice(0, 4).map(h => h.id)],
    ...(rankingOnly ? {rankingOnly:true} : {})};
}
