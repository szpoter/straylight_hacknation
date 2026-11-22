import { expect, it } from "vitest";
import { locateQuote } from "../src/lib/rag/answer";
import { citationUrl } from "../src/lib/rag/corpus";
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import { searchCorpus } from "../src/lib/rag/corpus-search";
import { localPublicRanking } from "../src/lib/rag/local-public-ranking";
import { answerPublicTurn, type AnswerDeps } from "../src/lib/zusik/ask-service";
import { routeCaseQuestion } from "../src/lib/zusik/v1/intent";

const law = loadCorpus("publiczne");
const deps: AnswerDeps = {
  corpus: loadCorpus(),
  selectCorpus: loadCorpus,
  searchCorpus,
  search: {
    async search({ lexical = [], limit }) {
      return {
        status: "ok",
        ms: 0,
        hits: lexical.slice(0, limit).map(hit => ({ ...hit, score: 1 })),
        rankings: { lexical: lexical.map(hit => hit.logicalId), dense: [] },
      };
    },
  },
  generate: async () => ({ model: "offline", status: "error", ms: 0, output: null }),
};

async function askInNewConversation(text: string) {
  const route = routeCaseQuestion(text, { facts: [] });
  if (!("input" in route) || route.input.intent !== "public_question") throw Error("Expected public route");
  const { publicLookup, publicQuestion } = route.input;
  const { answer } = await answerPublicTurn({ ...deps, publicLookup }, publicQuestion, []);
  return { publicLookup, answer };
}

it("carries the independent BM25 ranking through a new public conversation and quotes the quarterly rule", async () => {
  const text = "Czy informacje o wynagrodzeniu do podstawy wymiaru zasiłku pracownika uwzględniają premie kwartalne?";
  // Top five from the independent Python implementation on the same public edition.
  const expected = ["uz-42-1", "uz-41-1", "rz-zal2-3", "of-praca-10-2", "poradnik-26-1"];
  expect(localPublicRanking(text).slice(0, 5).map(hit => hit.id)).toEqual(expected);
  const { publicLookup, answer } = await askInNewConversation(text);
  expect(publicLookup?.ids).toEqual(expected);
  expect(answer.status).toBe("answered");
  const fragment = law.fragments.get(expected[0]);
  const citation = answer.citations.find(c => c.fragmentId === expected[0]);
  if (!fragment || !citation) throw Error("Missing quarterly provision");
  expect(citation.url).toBe(citationUrl(law, fragment));
  expect(locateQuote(fragment.sourceText, citation.quote)).toBeTruthy();
  expect(citation.quote).toMatch(/kwartalne.*jedną dwunastą.*cztery kwartały/u);
});

it("preserves the established waiting periods when a different guide scores highly for the wording", async () => {
  const text = "Jak długo musi trwać ubezpieczenie, aby uzyskać chorobowe przy dobrowolnym lub obowiązkowym tytule?";
  const { answer } = await askInNewConversation(text);
  expect(answer.status).toBe("answered");
  const fragment = law.fragments.get("uz-4-1");
  const citation = answer.citations.find(c => c.fragmentId === fragment?.logicalId);
  if (!fragment || !citation) throw Error("Missing waiting-period provision");
  expect(locateQuote(fragment.sourceText, citation.quote)).toBeTruthy();
  expect(citation.quote).toMatch(/30 dni.*obowiązkowo.*90 dni.*dobrowolnie/u);
});
