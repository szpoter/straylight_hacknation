// Text search for admin lists: diacritic-insensitive, every query word must match, results ranked by relevance.
import type { TestCase } from "./mock-data";

export interface SearchField {
  text: string;
  /** Higher weight ranks matches in this field above matches in others. */
  weight: number;
}

/** Lowercase, strip Polish diacritics (ą→a, ę→e, ł→l, …) and turn punctuation into spaces. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Normalized text without spaces, so "S-01", "s 01" and "s01" compare equal. */
function compact(text: string): string {
  return normalize(text).replace(/ /g, "");
}

export function tokenize(query: string): string[] {
  const words = normalize(query).split(" ").filter(Boolean);
  return [...new Set(words)];
}

/** Score of one query word in one field, 0 when it does not match. */
function wordScore(token: string, f: { words: string[]; text: string; compact: string }): number {
  if (f.words.includes(token) || f.compact === token) return 3;
  if (f.words.some((w) => w.startsWith(token)) || f.compact.startsWith(token)) return 2;
  // Single letters match only at a word start, otherwise "a" would match almost everything.
  if (token.length > 1 && f.compact.includes(token)) return 1;
  return 0;
}

/**
 * Returns a relevance score, or null when the item does not match.
 * Every query word has to match some field (AND). An empty query matches everything with score 0.
 */
export function scoreMatch(fields: SearchField[], query: string): number | null {
  const tokens = tokenize(query);
  if (tokens.length === 0) return 0;

  const prepared = fields.map((f) => {
    const text = normalize(f.text);
    return { text, words: text.split(" "), compact: text.replace(/ /g, ""), weight: f.weight };
  });

  let score = 0;
  for (const token of tokens) {
    let best = 0;
    for (const f of prepared) best = Math.max(best, wordScore(token, f) * f.weight);
    if (best === 0) return null;
    score += best;
  }

  // Bonus when the whole query appears as one phrase, e.g. "wspolna pula" or an ID typed as "s01".
  const phrase = compact(query);
  if (phrase.length >= 2) {
    for (const f of prepared) {
      if (f.compact === phrase) score += 10 * f.weight;
      else if (f.compact.includes(phrase)) score += 4 * f.weight;
    }
  }
  return score;
}

/** Filters and sorts items by relevance; ties keep the original order. Empty query returns the input. */
export function searchItems<T>(items: readonly T[], query: string, fields: (item: T) => SearchField[]): T[] {
  if (tokenize(query).length === 0) return [...items];
  return items
    .map((item, index) => ({ item, index, score: scoreMatch(fields(item), query) }))
    .filter((r): r is { item: T; index: number; score: number } => r.score !== null)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((r) => r.item);
}

/** Searchable fields of a test case, shared by the view and the tests. */
export function caseSearchFields(c: TestCase): SearchField[] {
  const statusLabel = { zgodna: "zgodna", niezgodna: "niezgodna", "brak-danych": "brak danych" }[c.status];
  return [
    { text: c.id, weight: 5 },
    { text: c.title, weight: 4 },
    { text: c.tag, weight: 3 },
    { text: statusLabel, weight: 2 },
    ...[...c.inputs, ...c.expected].map((d) => ({ text: `${d.label} ${d.value}`, weight: 1 })),
    ...(c.missing ? [{ text: c.missing, weight: 1 }] : []),
  ];
}
