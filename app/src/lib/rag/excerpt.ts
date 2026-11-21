import { citationUrl, type Corpus, type Fragment } from "./corpus";
import type { PublicQuestion } from "./public-query";
import type { AskAnswer, AskCitation } from "../zusik/types";

/** Direct quotation is limited to a few reviewed provisions that answer the
 * projected public question without deciding the family's individual case. */
export function extractiveAnswer(
  corpus: Corpus, projected: PublicQuestion, evidence: Fragment[], vectorIds: string[],
): AskAnswer | null {
  const reviewed: Array<[boolean, string[]]> = [
    [projected.corpus === "oferta" && projected.locators?.[0] === "program:800-plus", ["800-plus"]],
    [projected.corpus === "oferta" && projected.locators?.[0] === "program:aktywny-rodzic", ["aktywny-rodzic"]],
    [projected.corpus === "oferta" && projected.locators?.[0] === "program:dobry-start", ["dobry-start"]],
    [projected.question.startsWith("Czy samo zwolnienie"), ["uz-art6-ust1", "uz-art7"]],
    [projected.locators?.includes("rz:33:1") === true, ["rz-par33-ust1"]],
    [projected.locators?.includes("kp:1823:1") === true, ["kp-ojcowski"]],
    [projected.locators?.includes("uz:11:2") === true, ["uz-art11-ust2-pkt1", "uz-art6-ust1"]],
    [projected.question.startsWith("Jakie informacje należy zawrzeć"), ["rozp-2025-322-par15-ust1"]],
    [projected.question.startsWith("Skąd wiadomo, ile części"), ["kp-art182-1d-par2"]],
    [projected.question.startsWith("Kadry mają już odpis"), ["rozp-2025-322-par22", "rozp-2025-322-par15-ust2-pkt1"]],
    [projected.question.startsWith("Ile wcześniej i do kogo"), ["kp-art182-1d-par1"]],
    [projected.question.startsWith("Czy oboje rodzice mogą"), ["kp-art182-1a-par6"]],
    [projected.question.startsWith("Co wpisać o drugim rodzicu"), ["rozp-2025-322-par15-ust2-pkt2"]],
  ];
  const ids = reviewed.find(([applies]) => applies)?.[1] ?? [];
  if (!ids.length || !ids.some((id) => vectorIds.includes(id))) return null;
  const citations: AskCitation[] = [];
  for (const id of ids) {
    const fragment = evidence.find((f) => f.logicalId === id);
    const doc = fragment && corpus.documents.get(fragment.documentId);
    if (!fragment || !doc) return null;
    citations.push({
      id: "c" + (citations.length + 1), fragmentId: id, title: doc.shortTitle,
      locator: fragment.locator, url: citationUrl(corpus, fragment), quote: fragment.sourceText,
      headingPath: fragment.headingPath, page: fragment.page, authority: doc.authority,
      corpusVersion: corpus.manifest.corpusVersion,
    });
  }
  return {
    status: "answered", corpusVersion: corpus.manifest.corpusVersion,
    message: "Cytuję treść ze wskazanego źródła urzędowego.",
    claims: citations.map((c) => ({ text: c.quote, citationIds: [c.id] })), citations,
  };
}
