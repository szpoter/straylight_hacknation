import { isValidOn, type Corpus, type Fragment } from "./corpus";
import { corpusNames, loadCorpus } from "./corpus-fs";
import { corpusKeywords, facetEvidence, intents, query, terms as sourceTerms } from "./corpus-search";
import { benefitFilter } from "./benefit-scope";
import type { PublicQuestion } from "./public-query";
import { statutoryListIds } from "./relevance";
import { TOP_K } from "./retrieve";

type Entry = { name: PublicQuestion["corpus"]; corpus: Corpus; fragment: Fragment };

function index() {
  const entries = new Map<string, Entry | null>();
  const frequency = new Map<string, number>();
  let total = 0;
  for (const name of corpusNames) {
    const corpus = loadCorpus(name);
    for (const fragment of corpus.fragments.values()) {
      total++;
      const id = fragment.logicalId;
      entries.set(id, entries.has(id) ? null : {name, corpus, fragment});
      for (const key of sourceTerms(fragment.sourceText).keys()) frequency.set(key, (frequency.get(key) ?? 0) + 1);
    }
  }
  return { entries, frequency, total };
}
let cached: ReturnType<typeof index> | undefined;

function publicMaterial(ids: string[], words: string[]) {
  if (!Array.isArray(ids) || !ids.length || ids.length > TOP_K || new Set(ids).size !== ids.length ||
      !Array.isArray(words) || words.length < 2 || words.length > 8 || new Set(words).size !== words.length ||
      !words.every(word => typeof word === "string" && /^[a-ząćęłńóśźż]{4,45}$/u.test(word))) return null;
  const { entries, frequency, total } = cached ??= index();
  const today = new Date().toISOString().slice(0, 10);
  const ranked: Entry[] = [];
  for (const id of ids) {
    const entry = entries.get(id);
    if (!entry || !isValidOn(entry.corpus, entry.fragment, today)) return null;
    ranked.push(entry);
  }
  const surface = new Set(ranked[0].fragment.sourceText.toLowerCase().match(/\p{L}+/gu));
  return words.every(word => surface.has(word)) ? { ranked, frequency, total } : null;
}

/** Persistence accepts only actual public vocabulary, independently of whether it answers the question. */
export function knownPublicLookup(ids: string[], terms: string[]): boolean {
  return publicMaterial(ids, terms) !== null;
}

const candidate = ({fragment:{logicalId, fragmentSha256, corpusVersion}}: Entry) => ({logicalId, fragmentSha256, corpusVersion});

/** Current public points can corroborate retrieval without qualifying as the answer. */
export function publicRankedCandidates(ids: string[], terms: string[]) {
  return publicMaterial(ids, terms)?.ranked.map(candidate) ?? [];
}

/** Server boundary. Reconstruct the model-facing text from the active public edition. */
export function publicRankedPlan(ids: string[], facet: string, terms: string[]): PublicQuestion | null {
  if (!Object.hasOwn(intents, facet)) return null;
  const material = publicMaterial(ids, terms);
  if (!material) return null;
  const kind = facet as keyof typeof intents;
  const {ranked, frequency, total} = material;
  const supplied = sourceTerms(terms.join(" "));
  // The corpus retriever uses this IDF floor to distinguish a qualification from a broad subject.
  if (supplied.size < 2 || ![...supplied.keys()].some(key =>
    Math.log((total + 1) / (1 + (frequency.get(key) ?? 0))) > 3.3)) return null;

  const matchesBenefit = benefitFilter(terms);
  const candidates = ranked.flatMap(({name, corpus, fragment}) => {
    const text = fragment.sourceText;
    if (!matchesBenefit(corpus, fragment) || (kind !== "info" && !facetEvidence[kind].test(text))) return [];
    const literal = new Set(text.toLowerCase().match(/[a-ząćęłńóśźż]+/gu));
    if (!terms.every(word => literal.has(word))) return [];
    const allowed = [...sourceTerms(text)].filter(([key]) => supplied.has(key)).map(([,word]) => word);
    const question = query(kind, allowed);
    if (!corpusKeywords(question, fragment) || !statutoryListIds(corpus, fragment).every(id => ids.includes(id))) return [];
    return [{name, fragment, question, allowed}];
  });

  const target = candidates[0];
  if (!target || target.fragment !== ranked[0].fragment || candidates.some(({fragment}) => fragment.fragmentSha256 !== target.fragment.fragmentSha256 &&
      !target.fragment.primaryIds.includes(fragment.logicalId) && !fragment.primaryIds.includes(target.fragment.logicalId))) return null;
  const lexical = ranked.map(candidate);
  return {corpus:target.name, fragmentId:target.fragment.logicalId, question:target.question, searchText:target.allowed.join(" "), lexical};
}
