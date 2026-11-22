import { afterEach, expect, it, vi } from "vitest";
import type { Pool } from "pg";
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import { localCompletion, publicQueueEvidence, publicTaskPrompt, runPublicModelTask } from "../src/lib/rag/local-queue";
import { taskGrammar } from "../src/lib/rag/model-tasks";
import { publicQuestion } from "../src/lib/rag/public-query";
import { localRagModel, modelForTask } from "../src/lib/zusik/model-provider";

afterEach(() => vi.useRealTimers());
it("queues only fixed public question text and fragments from the approved corpus", () => {
  const corpus = loadCorpus("marta");
  const fragment = corpus.fragments.get("kp-art182-1d-par1");
  const raw = "Kiedy złożyć wniosek o urlop rodzicielski? Test 12345678901";
  const question = publicQuestion(raw)?.question;
  if (!fragment || !question) throw Error("Missing public fixture");
  expect(publicQueueEvidence(corpus, question, [fragment])).toEqual([fragment]);
  expect(publicQueueEvidence(corpus, raw, [fragment])).toBeNull();
  expect(publicQueueEvidence(corpus, question, [{ ...fragment, sourceText: raw }])).toBeNull();
  expect(publicQueueEvidence(corpus, "Jakie zasady określa wskazany przepis: §12345678901?", [fragment])).toBeNull();
});
it("uses Bielik by default and only explicit alternatives", () => {
  expect(localRagModel("")).toBe("bielik");
  expect(localRagModel("pllum")).toBe("pllum");
  expect(localRagModel("hosted")).toBeNull();
  expect(() => localRagModel("other")).toThrow();
});
it.each([[false, 4000, "unclaimed"], [true, 38400, "timeout"]] as const)(
  "bounds an unavailable worker (claimed=%s)", async (started, limit, status) => {
    vi.useFakeTimers();
    const client = { query: vi.fn(async () => ({ rows: [{ started, done: false }] })), release: vi.fn() };
    const pool = { connect: async () => client } as unknown as Pool;
    const work = localCompletion(pool, "bielik", "public fixture");
    await vi.advanceTimersByTimeAsync(limit);
    expect((await work).status).toBe(status);
    expect(client.release).toHaveBeenCalledTimes(1);
  },
);


it.each(["qwen-27b", "bielik", "pllum"] as const)("limits a claimed %s job using its own budget", async model => {
  vi.useFakeTimers();
  const started = Date.now();
  const output = "synthetic result";
  const client = {query: vi.fn(async () => ({rows:[{started:true, done:Date.now() - started >= 91_000, output}]})), release:vi.fn()};
  const queue = {connect:async () => client} as unknown as Pool;
  const request = localCompletion(queue, model, "approved synthetic input");
  await vi.advanceTimersByTimeAsync(38_001);
  if (model === "qwen-27b") {
    expect(client.release).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(54_000);
    expect(await request).toMatchObject({status:"ok", text:output});
  } else {
    expect((await request).status).toBe("timeout");
  }
  expect(client.release).toHaveBeenCalledOnce();
});

it("accepts only public catalogue references at the planner and verifier boundary", async () => {
  const fixture = { kind: "plan_public", aspect: "evidence", candidates: ["zlobek-odbiorca"], missing: [] } as const;
  const input = {...fixture,candidates:[...fixture.candidates],missing:[]};
  expect(publicTaskPrompt(input)).toContain(loadCorpus("oferta").fragments.get("zlobek-odbiorca")?.sourceText);
  const db = {connect:vi.fn()} as unknown as Pool;
  for (const bad of [{...input,text:"Surowe OCR dziecka 12345678901"},
    {...input,previousUnit:"12345678901"}, {...input,candidates:["surowy opis rodzica"]}]) {
    expect(await runPublicModelTask(db,bad,Date.now()+20000)).toMatchObject({status:"invalid_input",attemptId:null});
  }
  expect(db.connect).not.toHaveBeenCalled();
  expect(modelForTask("verify_claim",{ZUSIK_VERIFIER_MODEL:"bielik"})).toBe("bielik");
  expect(modelForTask("plan_public",{})).toBeNull();
});
it("checks structural outputs and evidence membership before returning the model plan", async () => {
  vi.stubEnv("ZUSIK_PLANNER_MODEL","pllum");
  const input = { kind:"plan_public" as const, aspect:"recipient" as const, candidates:["zlobek-odbiorca"], missing:[] };
  const good = {intent:"explain",nextTool:"searchCorpus",evidenceIds:["zlobek-odbiorca"],requiredFacts:[]};
  try {
    for (const [raw,status] of [[JSON.stringify(good),"ok"],["{","invalid_output"],
      [JSON.stringify({...good,nextTool:"other"}),"invalid_output"],
      [JSON.stringify({...good,nextTool:"prepareDraft"}),"invalid_output"],
      [JSON.stringify({...good,evidenceIds:["private"]}),"invalid_output"]] as const) {
      const client = {query:vi.fn(async () => ({rows:[{started:true,done:true,output:raw}]})),release:vi.fn()};
      const db={connect:async()=>client} as unknown as Pool;
      expect((await runPublicModelTask(db,input,Date.now()+15000)).status).toEqual(status);
      expect(client.query.mock.calls[0]).toEqual(["select zusik_model.submit_task($1,$2,$3,$4)",
        [expect.any(String),"pllum",publicTaskPrompt(input),"plan_public"]]);
    }
  } finally { vi.unstubAllEnvs(); }
});
it("exhausts a turn budget even when acquiring the Neon connection stalls", async () => {
  vi.useFakeTimers();
  const open = Promise.withResolvers<{query:ReturnType<typeof vi.fn>;release:ReturnType<typeof vi.fn>}>();
  const db={connect:()=>open.promise} as unknown as Pool;
  const request=localCompletion(db,"bielik","public fixture",undefined,"answer_evidence",100);
  await vi.advanceTimersByTimeAsync(100);
  expect((await request).status).toBe("timeout");
  const client={query:vi.fn(),release:vi.fn()};
  open.resolve(client);
  await open.promise;
  expect(client.query).not.toHaveBeenCalled();
  expect(client.release).toHaveBeenCalledOnce();
});

it("constrains Ollama's grammar to the current public fragment IDs and missing fields", () => {
  const schema = taskGrammar("plan_public", { candidates:[{id:"zlobek-odbiorca"}], missing:[] });
  expect(schema.properties?.evidenceIds).toMatchObject({items:{enum:["zlobek-odbiorca"]}});
  expect(schema.properties?.requiredFacts).toMatchObject({maxItems:0});
  expect(taskGrammar("verify_claim", {candidates:[]}).properties?.evidenceIds).toMatchObject({maxItems:0});
});
