import type { Pool } from "pg";
import { publicQuestion } from "../src/lib/rag/public-query";
import { afterEach, expect, it, vi } from "vitest";
import { AskService, type AnswerDeps } from "../src/lib/zusik/ask-service";
import { generateAnswer } from "../src/lib/rag/answer";
import { citationUrl } from "../src/lib/rag/corpus";
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import { checkCitedSources } from "../src/lib/rag/source-check";
import { messageInput } from "../src/lib/zusik/v1/conversation";

import { publicAnswerDeps } from "../src/lib/zusik/server";
import { publicReply } from "../src/lib/zusik/v1/public";
import { MemoryCaseStore, MemoryTurnStore } from "./helpers";

vi.mock("../src/lib/zusik/server", () => ({publicAnswerDeps: vi.fn()}));

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
it.each(["pllum", "qwen-27b"] as const)("keeps an explicit %s request local when no worker can answer", async selectedModel => {
  const hosted = vi.fn();
  vi.stubGlobal("fetch", hosted);
  const result = await generateAnswer({...settings, selectedModel}, corpus, "Dokumenty", [frag]);
  expect(result).toMatchObject({model: selectedModel, backend: "local-" + selectedModel, status: "error"});
  expect(hosted).not.toHaveBeenCalled();
});

it("submits Qwen only for approved public material, even with a hosted default", async () => {
  const corpus = loadCorpus("marta");
  const fragment = corpus.fragments.get("kp-art182-1d-par1");
  const question = publicQuestion("Kiedy złożyć wniosek o urlop rodzicielski?")?.question;
  if (!question || !fragment) throw Error("Missing public fixture");
  const output = {status: "insufficient_evidence", message: "", claims: []};
  const client = {query: vi.fn(async () => ({rows: [{done: true, output: JSON.stringify(output)}]})), release: vi.fn()};
  const queue = {connect: async () => client} as unknown as Pool;
  const hosted = vi.fn(() => { throw Error("Hosted configuration read"); });
  const options = {selectedModel: "qwen-27b" as const, queue, hosted};
  vi.stubEnv("ZUSIK_RAG_MODEL", "hosted");
  try {
    expect(await generateAnswer(options, corpus, question, [fragment])).toMatchObject({status: "ok", model: "qwen/qwen3.8-27b", backend: "local-qwen-27b", output});
    expect(client.query.mock.calls[0]).toEqual(["select zusik_model.submit($1,$2,$3)", [expect.any(String), "qwen-27b", expect.stringContaining(question)]]);
    client.query.mockClear();
    expect(await generateAnswer(options, corpus, question + " Prywatny dopisek", [fragment])).toEqual({status: "insufficient_evidence", output: null, ms: expect.any(Number)});
    expect(await generateAnswer({...options, deadlineMs: 0}, corpus, question, [fragment])).toMatchObject({status: "timeout", model: "qwen-27b"});
    expect(client.query).not.toHaveBeenCalled();
    expect(hosted).not.toHaveBeenCalled();
  } finally { vi.unstubAllEnvs(); }
});
it.each(["unapproved", "worker_error", "no_queue", "timeout"] as const)(
  "distinguishes %s in the public replies consumed by both chat clients", async scenario => {
    const corpus = loadCorpus("marta");
    const fragment = corpus.fragments.get("kp-art182-1d-par1");
    if (!fragment) throw Error("Missing public fixture");
    const question = "Kiedy złożyć wniosek o urlop rodzicielski?";
    const client = {query: vi.fn(async () => ({rows: [{done: true, output: null}]})), release: vi.fn()};
    const connect = vi.fn(async () => client);
    const hosted = vi.fn(() => { throw Error("Hosted configuration read"); });
    const options = {selectedModel: "qwen-27b" as const, hosted,
      queue: scenario === "no_queue" ? undefined : {connect} as unknown as Pool,
      deadlineMs: scenario === "timeout" ? 0 : undefined};
    const deps: AnswerDeps = {selectedModel: options.selectedModel, corpus, selectCorpus: loadCorpus,
      search: {search: async () => ({status: "ok", ms: 0, hits: [
        {logicalId: fragment.logicalId, fragmentSha256: fragment.fragmentSha256, score: 1},
      ]})},
      generate: (canonical, evidence, activeCorpus) => generateAnswer(options, activeCorpus, canonical,
        scenario === "unapproved" ? evidence.map(f => ({...f, sourceText: "Materiał testowy"})) : evidence),
    };
    vi.mocked(publicAnswerDeps).mockReturnValue(deps);
    const service = new AskService({...deps, store: new MemoryCaseStore(), turns: new MemoryTurnStore()});
    const legacy = await service.ask("synthetic", question, "synthetic-request");
    const v1Reply = () => publicReply(question, undefined, {model: "qwen-27b"});
    if (scenario === "unapproved") {
      expect(legacy).toMatchObject({status: 200, turn: {status: "insufficient_evidence", claims: [], citations: [],
        message: expect.stringContaining("zweryfikowanych źródeł publicznych")}, trace: {model: "insufficient_evidence", calls: {sherlock: 0}}});
      expect(legacy.trace?.modelId).toBeUndefined();
      expect(legacy.trace?.attemptId).toBeUndefined();
      expect(legacy.trace?.backend).toBeUndefined();
      expect(legacy.turn?.message).not.toMatch(/Qwen|ponowić|offline/iu);
      await expect(v1Reply()).resolves.toMatchObject({answer: legacy.turn?.message, citations: []});
      expect((await service.ask("synthetic", question, "synthetic-request")).turn).toEqual(legacy.turn);
    } else {
      expect(legacy).toMatchObject({status: 503, turn: {status: "unavailable", claims: [], citations: [],
        message: expect.stringContaining("Qwen 3.8 27B")}});
      await expect(v1Reply()).rejects.toMatchObject({status: 503, code: "selected_model_unavailable"});
    }
    expect(connect).toHaveBeenCalledTimes(scenario === "worker_error" ? 2 : 0);
    expect(hosted).not.toHaveBeenCalled();
  }
);

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
