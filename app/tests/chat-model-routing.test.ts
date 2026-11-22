import { afterEach, expect, it, vi } from "vitest";
import { generateAnswer } from "../src/lib/rag/answer";
import { citationUrl } from "../src/lib/rag/corpus";
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import { checkCitedSources } from "../src/lib/rag/source-check";
import { messageInput } from "../src/lib/zusik/v1/conversation";

const corpus = loadCorpus("oferta");
const frag = [...corpus.fragments.values()].find(f => corpus.documents.get(f.documentId)?.sourceType === "html")!;
const citation = { id: "c1", authority: "zus_guidance" as const, fragmentId: frag.logicalId, url: citationUrl(corpus, frag), quote: frag.sourceText,
  corpusVersion: corpus.manifest.corpusVersion, title: "", locator: "", headingPath: [], page: null };
const settings = { baseURL: "https://model.invalid", apiKey: "synthetic", model: "default-hosted" };
afterEach(() => vi.unstubAllGlobals());

it.each(["low", "high"] as const)("sends the %s native effort on Bielik 3.1 to the configured provider", async effort => {
  let body;
  vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
    body = JSON.parse(String(init.body));
    return Response.json({ id: "response", model: "arklabsai/Bielik-11B-v3.1-Instruct", created: 1,
      choices: [{index: 0, finish_reason:"stop", message:{role:"assistant",content:'{"status":"insufficient_evidence","claims":[]}'}}] });
  });
  await generateAnswer({...settings, selectedModel:"bielik", reasoningEffort:effort}, corpus, "Dokumenty", [frag]);
  expect(body).toMatchObject({model:"arklabsai/Bielik-11B-v3.1-Instruct", reasoning_effort:effort});
});
it("keeps an explicit PLLuM request off other model providers when the worker is unavailable", async () => {
  const hosted = vi.fn();
  vi.stubGlobal("fetch", hosted);
  const result = await generateAnswer({...settings, selectedModel:"pllum"},corpus,"Dokumenty",[frag]);
  expect(hosted).not.toHaveBeenCalled();
  expect(result).toMatchObject({model:"pllum",status:"error"});
});
it("only accepts verification and effort on public questions sent to Bielik", () => {
  const input = {intent:"public_question",publicQuestion:"Jak złożyć wniosek?"};
  expect(messageInput.safeParse({...input,modelOptions:{model:"pllum",effort:"high"}}).success).toBe(false);
  expect(messageInput.safeParse({...input,modelOptions:{model:"bielik",verification:"extra",effort:"high"}}).success).toBe(true);
  expect(messageInput.safeParse({intent:"ask_case",modelOptions:{model:"bielik"}}).success).toBe(false);
});
it("checks the official HTML once and reports unconfirmed quotes and mismatched addresses", async () => {
  const request = vi.fn(async () => new Response("<p>"+frag.sourceText+"</p>",{headers:{"Content-Type":"text/html"}}));
  const results = await checkCitedSources([citation,citation,{...citation,url:"https://example.invalid/"},{...citation,quote:"invented"}],[corpus],Date.now()+3000,request);
  expect(results).toBe(2);
  expect(request).toHaveBeenCalledTimes(1);
  expect(request.mock.calls[0]).toEqual([citation.url,expect.objectContaining({redirect:"error",credentials:"omit"})]);
  expect(await checkCitedSources([citation],[corpus],Date.now()+3000,async()=>new Response("Changed text",{headers:{"Content-Type":"text/html"}}))).toBe(0);
});
