import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import release from "../corpus/opportunities.json";
import forms from "../corpus/forms.json";
import sources from "../corpus/official-sources.json";
import { listOpportunities, opportunityQuestion } from "../src/lib/plan/opportunities";
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import { answerPublicTurn } from "../src/lib/zusik/ask-service";

const asOf = "2026-11-22";
const corpus = loadCorpus("oferta");

it("retains both care alternatives and sends only catalogue titles through the public route", async () => {
  const query = opportunityQuestion("Porównaj opcje dla córeczki Testowej: w domu albo w żłobku na ulicy Przykładowej.", asOf);
  expect(query).toBe("Pokaż możliwości wsparcia: Świadczenie aktywnie w żłobku, Świadczenie aktywnie w domu");
  const { answer } = await answerPublicTurn({
    corpus, selectCorpus: () => corpus, asOf: () => asOf,
    search: { search: async ({ lexical = [] }) => ({ status: "ok", ms: 1, hits: lexical.map(h => ({ ...h, score: 1 })) }) },
    generate: async () => { throw Error("Unexpected generation for the catalogue"); },
  }, query ?? "", []);
  expect(answer.opportunities?.map(c => c.id)).toEqual(["aktywnie-w-zlobku", "aktywnie-w-domu"]);
  expect(answer.opportunities?.map(card => answer.citations.find(c => card.citationIds.includes(c.id))?.fragmentId))
    .toEqual(["zlobek-opieka", "of-dom-3-1"]);
  expect(answer.message).toContain("alternatywy");
});

it("preserves a recent birth as a current discovery and leaves dated claims and filing questions to the public route", () => {
  expect(opportunityQuestion("W zeszłym tygodniu urodziła mi się córka.", asOf)).toContain("800+");
  for (const text of ["Jakie wsparcie na żłobek obowiązywało w 2023 roku?", "Kto dostaje przelew za żłobek?",
    "Porównaj stawki zasiłku za ojcowski i rodzicielski.", "Córka zacznie szkołę. Jak złożyć wniosek o wyprawkę?"]) {
    expect(opportunityQuestion(text, asOf)).toBeNull();
  }
  expect(listOpportunities({ text: "Po porodzie dziecko zostało w szpitalu.", asOf }).candidates[0]?.id)
    .toBe("uzupelniajacy-macierzynski");
  expect(listOpportunities({ text: "Zamknięto żłobek, zostajemy w domu.", asOf }).candidates[0]?.id)
    .toBe("opieka-zamkniecie");
});

it("keeps public card, condition, channel, exclusion and form evidence reproducible", () => {
  for (const card of release.cards) {
    const references = [card.evidence, card.channel, card.conflictEvidence, card.dateEvidence, ...card.exclusions, ...card.conditions.map(c => c.evidence)];
    for (const id of references) if (id) expect(corpus.fragments.has(id), id).toBe(true);
  }
  for (const form of forms) {
    expect(createHash("sha256").update(readFileSync(`corpus/${form.snapshot}`)).digest("hex")).toBe(form.sha256);
    expect(corpus.fragments.has(form.evidence)).toBe(true);
  }
  for (const source of sources.filter(s => s.snapshot.endsWith(".json"))) {
    const bytes = readFileSync(`corpus/${source.snapshot}`);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(source.snapshotSha256);
    const snapshot: {blocks: string[]}[] = JSON.parse(bytes.toString("utf8"));
    const available = new Set(snapshot.flatMap(section => section.blocks));
    for (const f of corpus.fragments.values()) {
      if (f.documentId === source.sourceId && f.logicalId.startsWith("of-")) expect(available.has(f.sourceText), f.logicalId).toBe(true);
    }
  }
});

it("ranks the changed form of care and retains unknown conditions as one question", () => {
  const nursery = listOpportunities({asOf, text:"Wracamy do pracy, córka pójdzie do żłobka", facts:{careType:"nursery"}});
  expect(nursery.candidates[0].id).toBe("aktywnie-w-zlobku");
  expect(nursery.candidates[0].missingFacts).toContain("registeredCare");
  expect(nursery.nextQuestion).toMatch(/rejestr/);
  const home = listOpportunities({asOf,text:"Jednak zostanie z babcią",facts:{careType:"home",childAgeMonths:18}});
  expect(home.candidates.map(c=>c.id)).toEqual(expect.arrayContaining(["aktywnie-w-domu","aktywni-rodzice-w-pracy"]));
  expect(home.candidates.map(c=>c.id)).not.toContain("aktywnie-w-zlobku");
  expect(home.candidates.map(c=>c.exclusiveGroup)).toContain("aktywny-rodzic-dziecko-miesiac");
});

it.each([["Noworodek leży w inkubatorze", "uzupelniajacy-macierzynski"],["Córka zaczyna podstawówkę", "dobry-start"],["Zamknęli nam żłobek", "opieka-zamkniecie"]])("finds a public opportunity for %s", (text,id) => {
  expect(listOpportunities({asOf,text}).candidates.map(c=>c.id)).toContain(id);
});

it("respects withdrawal and future dates with a new, data-only card", () => {
  const extension = {...release.cards[0],id:"test",title:"Nauka pływania",terms:["basen"],validFrom:"2027-01-01",validTo:"2027-06-30",status:"future"};
  const catalog = {...release,cards:[extension]};
  const run = (day:string) => listOpportunities({asOf:day,text:"basen"},catalog).candidates;
  expect(run(asOf)).toHaveLength(0);
  expect(run("2027-01-01")[0]?.id).toBe("test");
  expect(run("2027-07-01")).toHaveLength(0);
  expect(listOpportunities({asOf,text:"RKO",fullCatalog:true}).candidates.some(c => c.id === "rko")).toBe(false);
});
