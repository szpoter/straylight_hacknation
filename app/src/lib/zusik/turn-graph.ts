import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { isValidOn, type Corpus } from "../rag/corpus";
import { getOfficialSection } from "../rag/official-sections";
import { fetchOfficialEvidence } from "../rag/official-fetch";
import { TOP_K, type KnowledgeSearch, type VectorHit } from "../rag/retrieve";
import type { AskAnswer, AskCitation, AskTurn } from "./types";

const nursery = "zus-aktywnie-w-zlobku";
type Facet = "care" | "recipient";
const recipient = /(?:na (?:czyje|jakie) konto|na czyj rachunek|przelew do mnie|do kogo (?:pójdą|trafią|idą) pieniądze|kto (?:dostanie|otrzyma) przelew)/iu;
const recipientOnly = /^(?:a |i )?(?:to )?(?:na (?:czyje|jakie) konto|na czyj rachunek|(?:a )?przelew do mnie|do kogo (?:pójdą|trafią|idą) pieniądze|kto (?:dostanie|otrzyma) przelew)[?!.\s]*$/iu;

export function nurseryIntent(text: string, previous?: AskTurn): Facet | null {
  if (recipientOnly.test(text) && previous?.citations.some(c => c.sourceId === nursery)) return "recipient";
  if (!/żłob(?:ek|k)|klub(?:u|ie)? dziecięc/iu.test(text)) return null;
  if (/zamknię|zamknę|likwidac|chory|chorob|opiek[uń]+cz|20\d{2}|kiedyś|wcześniej|zeszł|ubiegł/iu.test(text)) return null;
  if (recipient.test(text)) return "recipient";
  // General orientation can include a planned start month. A dated claim needs its own rule.
  return /wracam do pracy|(?:idzie|pójdzie|chodzi|będzie|zaczyna|zacznie).{0,40}żłob|co (?:warto|mo[gż]|sprawdzić)|jakie wsparcie/iu.test(text)
    && !/ile|kwot|do kiedy|jaki termin|załącz|formularz|jak złożyć|wyżywieni|opłat/iu.test(text) ? "care" : null;
}

const state = Annotation.Root({
  citation: Annotation<AskCitation | null>, hits: Annotation<VectorHit[]>,
  unavailable: Annotation<boolean>, fetches: Annotation<number>,
});

export async function runSectionTurn(
  facet: Facet, corpus: Corpus, search: KnowledgeSearch, asOf: string,
  live: typeof fetchOfficialEvidence, progress?: (text: string) => void,
) {
  const section = getOfficialSection(nursery, facet);
  if (!section) throw new Error("Missing official nursery section");
  const query = section.title + ". " + section.heading;
  const graph = new StateGraph(state)
    .addNode("searchCorpus", async () => {
      progress?.("Szukam w materiałach ZUS…");
      const result = await search.search({ query, expanded: null, corpusVersion: corpus.manifest.corpusVersion, limit: TOP_K });
      const fragment = corpus.fragments.get(section.fragmentId);
      const doc = corpus.documents.get(nursery);
      const matched = result.hits.some(hit => hit.logicalId === fragment?.logicalId && hit.fragmentSha256 === fragment?.fragmentSha256);
      const citation: AskCitation | null = result.status === "ok" && matched && fragment && doc &&
        fragment.documentId === doc.id && isValidOn(corpus, fragment, asOf) ? {
          id: "c1", sourceId: doc.id, fragmentId: fragment.logicalId, title: doc.title, locator: fragment.locator,
          url: doc.url, quote: fragment.sourceText, headingPath: fragment.headingPath, page: fragment.page,
          authority: doc.authority, corpusVersion: corpus.manifest.corpusVersion, origin: "corpus",
          hash: fragment.fragmentSha256, retrievedAt: doc.retrievedAt,
        } : null;
      return { hits: result.hits, citation, unavailable: result.status === "error" };
    })
    .addNode("fetchOfficialEvidence", async () => {
      progress?.("Sprawdzam oficjalną stronę ZUS…");
      return live(nursery, facet);
    })
    .addEdge(START, "searchCorpus")
    .addConditionalEdges("searchCorpus", s => s.citation || s.unavailable ? END : "fetchOfficialEvidence")
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
