import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { isValidOn, type Corpus } from "../rag/corpus";
import { getOfficialSection } from "../rag/official-sections";
import { fetchOfficialEvidence } from "../rag/official-fetch";
import { TOP_K, type KnowledgeSearch, type VectorHit } from "../rag/retrieve";
import type { AskAnswer, AskCitation, AskTurn } from "./types";

const nursery = "zus-aktywnie-w-zlobku";
type Facet = "care" | "recipient";
const school = "zus-dobry-start";
const recipient = /(?:na (?:czyje|jakie) konto|na czyj rachunek|przelew do mnie|do kogo (?:pójdą|trafią|idą) pieniądze|kto (?:dostanie|otrzyma) przelew|komu.{0,35}wypłac|kto.{0,20}(?:dostaje|otrzymuje|otrzyma).{0,12}(?:pieniądze|świadczenie))/iu;
const recipientOnly = /^(?:a |i )?(?:to )?(?:na (?:czyje|jakie) konto|na czyj rachunek|(?:a )?przelew do mnie|do kogo (?:pójdą|trafią|idą) pieniądze|kto (?:dostanie|otrzyma) przelew)[?!.\s]*$/iu;

const correction = /^(?:nie[, ]+)?(?:chodzi(?:ło)? mi o|chodzi o|pytam o|mam na myśli) (?:program )?/iu;

export function schoolRecipientIntent(text: string, previous?: AskTurn): boolean {
  if (/20\d{2}|zeszł|ubiegł|kiedyś|jeśli|jeżeli|w przypadku/iu.test(text)) return false;
  const named = /dobr(?:y|ego|ym) start|300\s*(?:\+|plus)|wyprawk/iu.test(text);
  if (named && recipient.test(text) && !/żłob|klub dziecięc/iu.test(text)) return true;
  if (named && correction.test(text) && /^(?:dobry start|300\s*(?:\+|plus))[.!? ]*$/iu.test(text.replace(correction, "")))
    return !!previous?.citations.some(c => /^(?:live-)?zlobek-odbiorca(?:-|$)/u.test(c.fragmentId));
  return recipientOnly.test(text) && !!previous?.citations.length &&
    previous.citations.every(c => c.sourceId === school || /\/program-dobry-start(?:$|#)/u.test(c.url));
}

export function nurseryIntent(text: string, previous?: AskTurn): Facet | null {
  if (recipientOnly.test(text) && previous?.citations.length && previous.citations.every(c => c.sourceId === nursery)) return "recipient";
  if (!/żłob(?:ek|k)|klub(?:u|ie)? dziecięc/iu.test(text) || /dobr(?:y|ego|ym) start|300\s*(?:\+|plus)/iu.test(text)) return null;
  if (correction.test(text) && /^(?:aktywnie w żłobku|żłobek)[.!? ]*$/iu.test(text.replace(correction, "")) &&
      previous?.citations.some(c => /^(?:live-)?of-dobry-1-2(?:-|$)/u.test(c.fragmentId))) return "recipient";
  if (/zamknię|zamknę|likwidac|chory|chorob|opiek[uń]+cz|20\d{2}|kiedyś|wcześniej|zeszł|ubiegł/iu.test(text)) return null;
  if (recipient.test(text)) return "recipient";
  // General orientation can include a planned start month. A dated claim needs its own rule.
  return /wracam do pracy|(?:idzie|pójdzie|chodzi|będzie|zaczyna|zacznie).{0,40}żłob|co (?:warto|mo[gż]|sprawdzić)|jakie wsparcie/iu.test(text)
    && !/ile|kwot|do kiedy|jaki termin|załącz|formularz|jak złożyć|wyżywieni|opłat/iu.test(text) ? "care" : null;
}

const state = Annotation.Root({
  citation: Annotation<AskCitation | null>, hits: Annotation<VectorHit[]>,
  searchError: Annotation<boolean>, unavailable: Annotation<boolean>, fetches: Annotation<number>,
});

export async function runSectionTurn(
  facet: Facet | "schoolRecipient", corpus: Corpus, search: KnowledgeSearch, asOf: string,
  live: typeof fetchOfficialEvidence, progress?: (text: string) => void, deadlineMs?: number,
) {
  const source = facet === "schoolRecipient" ? school : nursery;
  const sectionFacet = facet === "schoolRecipient" ? "recipient" : facet;
  const section = getOfficialSection(source, sectionFacet);
  if (!section) throw new Error("Missing official programme section");
  const query = section.title + ". " + section.heading;
  const graph = new StateGraph(state)
    .addNode("searchCorpus", async () => {
      progress?.("Szukam w materiałach ZUS…");
      const fragment = corpus.fragments.get(section.fragmentId);
      const corpusVersion = corpus.manifest.corpusVersion;
      const lexical = fragment ? [{corpusVersion,logicalId:fragment.logicalId,fragmentSha256:fragment.fragmentSha256}] : undefined;
      const result = await search.search({ query, expanded: null, corpusVersion, limit: TOP_K, deadlineMs, lexical, asOf });
      const doc = corpus.documents.get(source);
      const matched = result.hits.some(hit => hit.corpusVersion === corpus.manifest.corpusVersion && hit.logicalId === fragment?.logicalId && hit.fragmentSha256 === fragment?.fragmentSha256);
      const citation: AskCitation | null = result.status === "ok" && matched && fragment && doc &&
        fragment.documentId === doc.id && isValidOn(corpus, fragment, asOf) ? {
          id: "c1", sourceId: doc.id, fragmentId: fragment.logicalId, title: doc.title, locator: fragment.locator,
          url: doc.url, quote: fragment.sourceText, headingPath: fragment.headingPath, page: fragment.page,
          authority: doc.authority, corpusVersion: corpus.manifest.corpusVersion, origin: "corpus",
          hash: fragment.fragmentSha256, retrievedAt: doc.retrievedAt,
        } : null;
      return { hits: result.hits, citation, searchError: result.status === "error", unavailable: result.status === "error" };
    })
    .addNode("fetchOfficialEvidence", async () => {
      progress?.("Sprawdzam oficjalną stronę ZUS…");
      return live(source, sectionFacet, deadlineMs);
    })
    .addEdge(START, "searchCorpus")
    .addConditionalEdges("searchCorpus", s => s.citation ? END : "fetchOfficialEvidence")
    .addEdge("fetchOfficialEvidence", END).compile();
  const result = await graph.invoke({ hits: [], fetches: 0, unavailable: false, citation: null });
  const c = result.citation;
  const answer: AskAnswer = {
    publicQuery: query, corpusVersion: c?.corpusVersion ?? corpus.manifest.corpusVersion,
    status: c ? "answered" : result.unavailable ? "unavailable" : "insufficient_evidence",
    claims: c ? [{ text: c.quote, citationIds: [c.id] }] : [], citations: c ? [c] : [],
    message: c ? (facet === "care" ? "Warto sprawdzić świadczenie „Aktywnie w żłobku”. Czy wybrana placówka jest wpisana do rejestru żłobków?" : "")
      : "Nie udało się potwierdzić tego szczegółu w źródle ZUS.",
  };
  return { answer, result, query };
}
