import data from "./local-public-ranking-index.json";

export type LocalPublicFacet = "entitlement" | "duration" | "deadline" | "documents" | "payer" | "proof" | "recipient" | "rate" | "channel";
export interface LocalPublicHit {
  id: string;
  words: string[];
  score: number;
  coverage: number;
  subjectText: string;
  facets: LocalPublicFacet[];
}

type Document = [id: string, validity: number, bodyLength: number, headingLength: number, facets: number, subject: string];
const documents = data.docs as Document[];
const facets = data.facets as LocalPublicFacet[];

function decodeIds(encoded: string): Uint16Array {
  const bytes = atob(encoded);
  const result = new Uint16Array(bytes.length / 2);
  for (let i = 0; i < result.length; i++) result[i] = bytes.charCodeAt(i * 2) | (bytes.charCodeAt(i * 2 + 1) << 8);
  return result;
}

function dictionary() {
  const lookup = new Map(data.lemmas.map((lemma, id) => [lemma, id] as const));
  for (const id of data.lemmas.keys()) {
    if (data.inflections[id]) {
      for (const group of data.inflections[id].split(";")) {
        const [prefix, endings] = group.split("|");
        for (const ending of endings.split(" ")) lookup.set(prefix + ending, id);
      }
    }
  }
  return { lookup, tokens: decodeIds(data.tokens), surfaceLemmas: decodeIds(data.surfaceLemmas) };
}

let words: ReturnType<typeof dictionary> | undefined;
type Posting = { doc: number; body: number; heading: number };
const idf = (total: number, df: number) => Math.log1p((total - df + 0.5) / (df + 0.5));
const norm = (length: number, average: number) => 1.2 * (0.25 + 0.75 * length / (average || 1));
const tf = (frequency: number, normalizer: number) => frequency * 2.2 / (frequency + normalizer);

function buildIndex(today: string) {
  const { tokens, surfaceLemmas } = (words ??= dictionary());
  const offsets: number[] = [];
  const postings: Posting[][] = data.lemmas.map(() => []);
  let offset = 0;
  let active = 0;
  let bodyTotal = 0;
  let headingTotal = 0;
  for (const [doc, [, validity, bodyLength, headingLength]] of documents.entries()) {
    const [from, to] = data.validity[validity];
    offsets.push(offset);
    const bodyEnd = offset + bodyLength;
    const end = bodyEnd + headingLength;
    if ((!from || from <= today) && (!to || today <= to)) {
      active++;
      bodyTotal += bodyLength;
      headingTotal += headingLength;
      for (let i = offset; i < end; i++) {
        const list = postings[surfaceLemmas[tokens[i]]];
        let posting = list.at(-1);
        if (posting?.doc !== doc) {
          posting = {doc, body: 0, heading: 0};
          list.push(posting);
        }
        if (i < bodyEnd) posting.body++;
        else posting.heading++;
      }
    }
    offset = end;
  }
  return {
    today, offsets,
    unknownWeight: idf(active, 0),
    bodyNorm: documents.map(d => norm(d[2], bodyTotal / (active || 1))),
    headingNorm: documents.map(d => norm(d[3], headingTotal / (active || 1))),
    terms: postings.map(hits => ({
      hits,
      bodyWeight: idf(active, hits.filter(p => p.body).length),
      headingWeight: idf(active, hits.filter(p => p.heading).length),
      coverageWeight: idf(active, hits.length),
    })),
  };
}

let index: ReturnType<typeof buildIndex> | undefined;

/** The entire utterance is scored locally. Only vocabulary from a verified source body is returned as keywords. */
export function localPublicRanking(text: string): LocalPublicHit[] {
  const input = text.normalize("NFC").toLowerCase().match(/[\p{L}\p{N}]+/gu)?.filter(w => w.length > 1 || /^\d$/u.test(w));
  if (!input?.length) return [];
  const {lookup, tokens, surfaceLemmas} = (words ??= dictionary());
  const known = new Set<number>();
  const unknown = new Set<string>();
  for (const word of input) {
    const term = lookup.get(word);
    if (term === undefined) unknown.add(word);
    else known.add(term);
  }
  if (!known.size) return [];
  const today = new Date().toISOString().slice(0, 10);
  const current = index?.today === today ? index : (index = buildIndex(today));
  const scores = new Float64Array(documents.length);
  const covered = new Float64Array(documents.length);
  let total = unknown.size * current.unknownWeight;
  for (const term of known) {
    const {hits, bodyWeight, headingWeight, coverageWeight} = current.terms[term];
    total += coverageWeight;
    for (const {doc, body, heading} of hits) {
      scores[doc] += bodyWeight * tf(body, current.bodyNorm[doc]) + 0.5 * headingWeight * tf(heading, current.headingNorm[doc]);
      covered[doc] += coverageWeight;
    }
  }
  return documents.map((_, doc) => doc).filter(doc => scores[doc] > 0)
    .sort((a, b) => scores[b] - scores[a] || a - b).slice(0, 20).map(doc => {
      const [id, , bodyLength, , mask, subjectText] = documents[doc];
      const first = new Map<number, number>();
      const start = current.offsets[doc];
      for (let pos = start; pos < start + bodyLength; pos++) {
        const surface = tokens[pos], term = surfaceLemmas[surface];
        if (known.has(term) && !first.has(term) && /^\p{L}{4,}$/u.test(data.surfaces[surface])) first.set(term, pos);
      }
      const keywordPositions = [...first].sort(([a], [b]) => current.terms[b].bodyWeight - current.terms[a].bodyWeight)
        .slice(0, 8).map(([, position]) => position).sort((a, b) => a - b);
      return {id, words: keywordPositions.map(pos => data.surfaces[tokens[pos]]), score: scores[doc],
        coverage: covered[doc] / total, subjectText, facets: facets.filter((_, bit) => (mask & (1 << bit)) !== 0)};
    });
}
