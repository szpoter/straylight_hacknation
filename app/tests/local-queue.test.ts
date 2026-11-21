import { afterEach, expect, it, vi } from "vitest";
import type { Pool } from "pg";
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import { localCompletion, publicQueueEvidence } from "../src/lib/rag/local-queue";
import { publicQuestion } from "../src/lib/rag/public-query";
import { localRagModel } from "../src/lib/zusik/model-provider";

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
