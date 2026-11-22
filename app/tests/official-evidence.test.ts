import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { officialCatalogueReader, officialEvidenceReader } from "@/lib/rag/official-fetch";
import { FAMILY_CATALOG_URL } from "@/lib/rag/official-sections";
import { answerPublicTurn, answerQuestion } from "@/lib/zusik/ask-service";
import { loadCorpus } from "@/lib/rag/corpus-fs";
import type { AskTurn } from "@/lib/zusik/types";
import type { KnowledgeSearch } from "@/lib/rag/retrieve";
import { nurseryIntent, runSectionTurn } from "@/lib/zusik/turn-graph";

const sourceId = "zus-aktywnie-w-zlobku";
const html = readFileSync("corpus/oferta/snapshots/zus-aktywnie-w-zlobku.html", "utf8");
describe("official evidence", () => {
  it("fetches one canonical public page for concurrent reads and keeps the checked version", async () => {
    const request = vi.fn(async () => new Response(html, { headers: { "content-type": "text/html" } }));
    const read = officialEvidenceReader(request);
    const [care, payment] = await Promise.all([read(sourceId, "care"), read(sourceId, "recipient")]);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith("https://www.zus.pl/aktywnyrodzic/wiadczenie-aktywnie-w-zlobku",
      expect.objectContaining({ credentials: "omit", redirect: "manual", headers: { accept: "text/html" } }));
    expect(care.citation?.hash).not.toBe(payment.citation?.hash);
    expect(payment.citation?.quote).toContain("rachunek bankowy podmiotu");
    expect(await read(sourceId, "recipient")).toEqual({ ...payment, fetches: 0 });
  });
  it("rejects unregistered inputs before HTTP and observes Retry-After", async () => {
    const request = vi.fn(async () => new Response(null, { status: 429, headers: { "retry-after": "180" } }));
    const read = officialEvidenceReader(request);
    expect((await read("unknown", "recipient")).fetches).toBe(0);
    expect(await read(sourceId, "recipient")).toEqual({ fetches: 1, unavailable: true, citation: null });
    expect((await read(sourceId, "recipient")).fetches).toBe(0);
    expect(request).toHaveBeenCalledTimes(1);
  });
  it("discards a successful HTTP response without the approved section", async () => {
    const read = officialEvidenceReader(async () => new Response("<nav>Komu wypłacamy</nav>", { headers: { "content-type": "text/html" } }));
    expect(await read(sourceId, "recipient")).toEqual({ fetches: 1, unavailable: false, citation: null });
  });
  it("recovers the payment recipient from the official page during a collection outage", async () => {
    expect(nurseryIntent("Komu ZUS wypłaca świadczenie aktywnie w żłobku?")).toBe("recipient");
    const live = officialEvidenceReader(async () => new Response(html, { headers: { "content-type": "text/html" } }));
    const { answer, result } = await runSectionTurn("recipient", loadCorpus("oferta"),
      { search: async () => ({ hits: [], status: "error", ms: 1 }) }, "2026-11-22", live);
    expect(result.searchError).toBe(true);
    expect(answer.claims[0].text).toContain("rachunek bankowy podmiotu");
    expect(answer.citations[0]).toMatchObject({ sourceId, origin: "official_live" });
  });
  it("switches the payment recipient on correction and retains the corrected topic on a follow-up", async () => {
    const corpus = loadCorpus("oferta");
    const generate = vi.fn((): never => { throw new Error("Unexpected model call"); });
    const deps = { corpus, selectCorpus:loadCorpus, generate,
      search:{search: async ({ lexical }: Parameters<KnowledgeSearch["search"]>[0]) =>
        ({status:"ok" as const,ms:1,hits:(lexical ?? []).map(f=>({...f,score:1}))})} };
    const history: AskTurn[] = [];
    for (const [text, id] of [
      ["Komu ZUS wypłaca świadczenie aktywnie w żłobku?", "zlobek-odbiorca"],
      ["Nie, chodzi mi o Dobry Start.", "of-dobry-1-2"],
      ["A na czyje konto?", "of-dobry-1-2"],
      ["A kto otrzymuje ten przelew za żłobek?", "zlobek-odbiorca"],
      ["Kto dostaje przelew?", "zlobek-odbiorca"],
      ["Kto dostanie przelew z Dobrego Startu?", "of-dobry-1-2"],
      ["Chodziło mi o żłobek.", "zlobek-odbiorca"],
    ]) {
      const {answer} = await answerPublicTurn(deps,text,history);
      expect(answer.citations.map(c=>c.fragmentId), text).toEqual([id]);
      expect(answer.claims[0].text).toBe(corpus.fragments.get(id)?.sourceText);
      history.push({...answer,question:text,requestId:id,createdAt:""});
    }
    expect(generate).not.toHaveBeenCalled();
  });

  it("distinguishes starting nursery from closure, dates and personal calculations", () => {
    expect(nurseryIntent("Od stycznia syn będzie w żłobku. Co warto sprawdzić?")).toBe("care");
    for (const question of ["na czyje konto?", "Zamknęli żłobek, co mogę zrobić?", "Dziecko zacznie żłobek. Ile dostanę?",
      "Co mogłam dostać za żłobek w 2021 roku?", "Kto otrzymuje przelew za żłobek w 2021 roku?",
      "Wyprawka szkolna czy żłobek: kto otrzymuje przelew?"]) expect(nurseryIntent(question)).toBeNull();
  });
});

describe("family catalogue discovery", () => {
  const link = FAMILY_CATALOG_URL + "/bursztynowy-plecak";
  const title = "Program Bursztynowy Plecak";
  const wrap = (s: string) => '<h1>' + title + '</h1><div class="article__main"><div class="zus-cms">' + s + '</div></div>';
  const html = (s: string) => new Response(wrap(s), { headers: { "content-type": "text/html" } });
  const index = () => html('<a href="' + link + '">' + title + '</a>');
  const today = new Date().toISOString().slice(0, 10);
  const question = "Jakie dokumenty są potrzebne w programie Bursztynowy Plecak? Maria Prywatna, prywatne@example.test.";
  const section = "<h2>Jakie dokumenty dołączyć</h2><p>Dołącz potwierdzenie zapisania do programu próbnego.</p>";
  it("discovers the new page on a miss and only sends registry URLs with public headers", async () => {
    const request = vi.fn<typeof fetch>(async url => String(url) === FAMILY_CATALOG_URL ? index() : html(section));
    const search = vi.fn(async () => ({ hits: [], status: "ok" as const, ms: 1 }));
    const result = await answerQuestion({ corpus: loadCorpus("oferta"), search: { search }, generate: vi.fn(),
      discoverOfficial: officialCatalogueReader(request) }, question, undefined, { corpus: "oferta", question: title });
    expect(search).toHaveBeenCalledTimes(1);
    expect(result.answer.citations[0]).toMatchObject({ origin: "official_live", url: link, locator: "Jakie dokumenty dołączyć" });
    expect(result.trace.officialFetches).toBe(2);
    expect(request.mock.calls.map(([url]) => url)).toEqual([FAMILY_CATALOG_URL, link]);
    expect(JSON.stringify(request.mock.calls)).not.toMatch(/Prywatna|example\.test|dokumenty/);
  });
  it("skips history and declines ambiguous, withdrawn or oversized content and unapproved redirects", async () => {
    for (const makeResponse of [
      () => html(section + section),
      () => html("<p>Program został wycofany.</p>" + section),
      () => new Response(null, { headers: { "content-length": "4194304", "content-type": "application/pdf" } }),
      () => new Response(null, { status: 302, headers: { location: "https://example.org/page" } }),
    ]) {
      const request = vi.fn<typeof fetch>(async url => String(url) === FAMILY_CATALOG_URL ? index() : makeResponse());
      const read = officialCatalogueReader(request);
      expect((await read(question, "2020-01-01")).fetches).toBe(0);
      expect((await read(question, today)).citation).toBeNull();
      expect(request.mock.calls.map(([url]) => url)).toEqual([FAMILY_CATALOG_URL, link]);
    }
  });
  it("keeps a submission question on its own section even when confirmation mentions the same words", async () => {
    const question = "Jak złożę wniosek w programie Bursztynowy Plecak?";
    const sections = "<h2>Jak złożę wniosek</h2><p>Wniosek przekaż przez stronę programu próbnego.</p>" +
      "<h2>Jak otrzymam potwierdzenie złożenia wniosku</h2><p>Po wysłaniu dostaniesz kopię potwierdzenia.</p>";
    const read = officialCatalogueReader(async url => String(url) === FAMILY_CATALOG_URL ? index() : html(sections));
    expect((await read(question, today)).citation?.locator).toBe("Jak złożę wniosek");
  });
});

it("rechecks the recipient for a single public programme when its earlier card had no verified source", async () => {
  const prior: AskTurn = {question:"Plan opieki",requestId:"one",status:"insufficient_evidence",
    createdAt:"",corpusVersion:"current",message:"",citations:[],claims:[],publicQuery:"Świadczenie aktywnie w żłobku"};
  const corpus = loadCorpus("oferta");
  const readOfficial = officialEvidenceReader(async () => new Response(html,{headers:{"content-type":"text/html"}}));
  const result = await answerPublicTurn({corpus,selectCorpus:loadCorpus,readOfficial,
    search:{search:async () => ({status:"ok",hits:[],ms:1})},generate:vi.fn()},"Na czyje konto?",[prior]);
  expect(result.answer.citations).toMatchObject([{origin:"official_live",sourceId}]);
  expect(nurseryIntent("Na czyje konto?",{...prior,publicQuery:"Świadczenie aktywnie w żłobku. Dobry Start"})).toBeNull();
});
