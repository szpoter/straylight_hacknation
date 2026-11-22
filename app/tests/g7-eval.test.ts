import { expect, it } from "vitest";
import { ragAssertions } from "../scripts/zusik-eval-g7";
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import type { AskTurn } from "../src/lib/zusik/types";

it("scores the retrieved article, the quoted condition, the answer and the action independently", () => {
  const corpus = loadCorpus("publiczne");
  const fragment = corpus.fragments.get("uz-6-1");
  if (!fragment) throw new Error("Missing quarantine fixture");
  const document = corpus.documents.get(fragment.documentId);
  if (!document) throw new Error("Missing official PDF");
  const trial = { id: "quarantine", group: "rag", questions: [], requiredEvidence: [fragment.logicalId],
    facts: ["kwarantann", "izolacj", "domow"] };
  const turn: AskTurn = {
    requestId: "independent", question: "", createdAt: "", status: "answered", message: "",
    corpusVersion: fragment.corpusVersion, claims: [{ text: fragment.sourceText, citationIds: ["c1"] }],
    citations: [{ id: "c1", title: document.title, locator: fragment.locator, page: fragment.page,
      fragmentId: fragment.logicalId, corpusVersion: fragment.corpusVersion, authority: document.authority,
      url: document.url, headingPath: fragment.headingPath, quote: fragment.sourceText }],
  };
  const retrieval = { top: [fragment.logicalId], evidence: [fragment.logicalId] };
  const checks = () => ragAssertions(trial, { turn, retrieval });
  expect(Object.values(checks()).every(Boolean)).toBe(true);
  turn.citations[0].quote = fragment.sourceText.slice(0, fragment.sourceText.indexOf(" 2."));
  expect(checks()).toMatchObject({ raw: true, citation: true, quoteAspect: false, fact: true });
  turn.claims[0].text = "Kwarantanna i izolacja w warunkach domowych nie są traktowane na równi z chorobą.";
  expect(checks()).toMatchObject({ fact: false });
  turn.claims[0].text = "Podstawa to 80% wynagrodzenia.";
  expect(checks()).toMatchObject({ fact: false });
  turn.status = "needs_clarification";
  expect(checks()).toMatchObject({ action: false });
  turn.citations[0].fragmentId = "wymyslony";
  expect(checks()).toMatchObject({ citation: false });
});
