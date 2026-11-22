import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { afterEach, expect, it, vi } from "vitest";
import { isValidOn } from "../src/lib/rag/corpus";
import { corpusNames, loadCorpus } from "../src/lib/rag/corpus-fs";
import { localPublicRanking } from "../src/lib/rag/local-public-ranking";

const forms: Record<string, string> = JSON.parse(gunzipSync(readFileSync("corpus/corpus-lexicon.json.gz")).toString()).forms;
function tokens(text: string) {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])
    .filter(word => word.length > 1 || /^\d$/u.test(word))
    .map(word => forms[word] ?? word);
}

const fragments = corpusNames.flatMap(name => {
  const corpus = loadCorpus(name);
  return [...corpus.fragments.values()].map(fragment => {
    const title = corpus.documents.get(fragment.documentId)?.shortTitle;
    const heading = [title, fragment.locator, ...fragment.headingPath, fragment.context].join(" ");
    return { corpus, fragment, body: tokens(fragment.sourceText), heading: tokens(heading) };
  });
});

afterEach(() => vi.useRealTimers());

// Score the unpacked official manifests directly, independent of the generated browser index.
it.each(["2026-11-22", "2026-12-01"])("reproduces field-weighted BM25 over sources valid on %s", day => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(day));
  const text = "zaświadczeniami ośrodka adopcyjnego oraz opieka faktyczna";
  const active = fragments.filter(row => isValidOn(row.corpus, row.fragment, day));
  const result = active.map(row => ({id: row.fragment.logicalId, score: 0}));
  for (const field of ["body", "heading"] as const) {
    const average = active.reduce((sum, row) => sum + row[field].length, 0) / active.length;
    for (const term of new Set(tokens(text))) {
      const df = active.filter(row => row[field].includes(term)).length;
      const idf = Math.log(1 + (active.length - df + 0.5) / (df + 0.5));
      active.forEach((row, i) => {
        const count = row[field].filter(word => word === term).length;
        const denominator = count + 1.2 * (1 - 0.75 + 0.75 * row[field].length / average);
        result[i].score += (field === "body" ? 1 : 0.5) * idf * 2.2 * count / denominator;
      });
    }
  }
  const reference = result.filter(row => row.score > 0).sort((a, b) => b.score - a.score).slice(0, 20);
  const actual = localPublicRanking(text);
  expect(actual.map(hit => hit.id)).toEqual(reference.map(hit => hit.id));
  actual.forEach((hit, rank) => {
    expect(hit.score).toBeCloseTo(reference[rank].score, 10);
    const body = active.find(row => row.fragment.logicalId === hit.id)?.fragment.sourceText;
    expect(hit.words.every(word => body?.includes(word) && /^\p{L}{4,}$/u.test(word))).toBe(true);
    expect(hit.words.length).toBeLessThanOrEqual(8);
    expect(hit.subjectText.length).toBeLessThanOrEqual(230);
    expect(hit.facets.includes("rate")).toBe(/%|procent/iu.test(body ?? ""));
  });
});

it("recognizes Polish inflections, counts a lemma once and penalizes unsupported conditions", () => {
  const ranked = localPublicRanking("szkolnej ośrodkowi");
  expect(ranked.length).toBeGreaterThan(0);
  expect(localPublicRanking("szkolnych ośrodka szkolnej")).toEqual(ranked);
  const unsupported = localPublicRanking("szkolnej ośrodkowi ksylobranq vextronicq");
  expect(unsupported.map(hit => hit.score)).toEqual(ranked.map(hit => hit.score));
  unsupported.forEach((hit, i) => {
    expect(hit.coverage).toBeLessThan(ranked[i].coverage);
    expect(hit.words.join(" ")).not.toMatch(/ksylobranq|vextronicq/iu);
  });
  expect(localPublicRanking("ksylobranq vextronicq")).toEqual([]);
  expect(localPublicRanking("")).toEqual([]);
});
