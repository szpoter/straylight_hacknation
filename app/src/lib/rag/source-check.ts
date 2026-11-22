import { createHash } from "node:crypto";
import { parse } from "next/dist/compiled/node-html-parser/index.js";
import type { AskCitation } from "../zusik/types";
import { citationUrl, normalizeSpaces, type Corpus } from "./corpus";
import { familyProgramUrl } from "./official-sections";
import { readLimitedBody } from "./official-fetch";
import { locateQuote } from "./answer";

function containsQuote(text: string | null, quote: string) {
  return text !== null && (text.includes(quote) || (quote.includes(" […] ") && locateQuote(text, quote) !== null));
}

/** Resolve addresses from published corpus metadata; a question never supplies a fetch destination. */
export async function checkCitedSources(citations: AskCitation[], corpora: Corpus[], deadline: number, request = fetch) {
  const pages = new Map<string, Promise<string | null>>();
  function load(url: string, pdf: boolean) {
    const key = (pdf ? "pdf " : "html ") + url;
    const existing = pages.get(key);
    if (existing) return existing;
    const task = (async () => {
      const budget = Math.min(3500, deadline - Date.now());
      if (budget <= 0) return null;
      const res = await request(url, { credentials: "omit", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(budget) });
      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok || !(pdf ? /application\/pdf/i : /text\/html/i).test(contentType)) {
        await res.body?.cancel();
        return null;
      }
      const bytes = await readLimitedBody(res, pdf ? 6 * 1024 * 1024 : 2 * 1024 * 1024);
      return pdf ? createHash("sha256").update(bytes).digest("hex") : normalizeSpaces(parse(bytes.toString("utf8")).text);
    })().catch(() => null);
    pages.set(key, task);
    return task;
  }

  const matches = await Promise.all(citations.map(async citation => {
    const quote = normalizeSpaces(citation.quote);
    if (!quote) return false;
    if (citation.origin === "official_live") {
      const url = familyProgramUrl(citation.url);
      return !!url && url === citation.url && containsQuote(await load(url, false), quote);
    }
    const corpus = corpora.find(c => c.manifest.corpusVersion === citation.corpusVersion);
    const fragment = corpus?.fragments.get(citation.fragmentId);
    if (!corpus || !fragment || citationUrl(corpus, fragment) !== citation.url || !containsQuote(normalizeSpaces(fragment.sourceText), quote)) return false;
    const doc = corpus.documents.get(fragment.documentId);
    if (!doc) return false;
    const pdf = doc.sourceType === "pdf";
    const current = await load(doc.url, pdf);
    return pdf ? current === doc.sourceSha256 : containsQuote(current, quote);
  }));
  return matches.filter(Boolean).length;
}
