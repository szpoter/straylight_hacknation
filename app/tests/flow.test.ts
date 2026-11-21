import { describe, expect, it } from "vitest";
import { FALLBACK_QUESTION } from "@/lib/zusik/constants";
import { ProbeService } from "@/lib/zusik/service";
import { FlakySaver, HIT, MemoryCaseStore, MODEL_QUESTION, fakeProviders } from "./helpers";

/**
 * Mirrors section 4 of PLAN-ETAP-1-KROK-1.md with controlled providers.
 * One shared saver + store = "Neon"; a new ProbeService = a new deployment/process.
 */
function world() {
  const saver = new FlakySaver();
  const store = new MemoryCaseStore();
  const deploy = (overrides?: Parameters<typeof fakeProviders>[0]) => {
    const fake = fakeProviders(overrides);
    return { service: new ProbeService({ store, checkpointer: saver, providers: fake.providers, leaseWaitMs: 2_000 }), calls: fake.calls };
  };
  return { saver, store, deploy };
}

async function checkpointCount(saver: FlakySaver, threadId: string) {
  const all = [];
  for await (const tuple of saver.list({ configurable: { thread_id: threadId } })) all.push(tuple);
  return all.length;
}

describe("stage 1 step 1 — durable probe", () => {
  it("start on A → F5 → first GET on B → resume on B → F5 (results table)", async () => {
    const { deploy } = world();
    const A = deploy();
    const marta = "session-marta";

    // Start A
    const start = await A.service.start(marta);
    expect(start.status).toBe(200);
    const v1 = start.view;
    expect(v1).toMatchObject({ state: "awaiting_choice", sourceId: "probe-opieka", question: MODEL_QUESTION, choice: null });
    expect(v1.providers).toEqual({ qdrant: "ok", sherlock: "ok" });
    expect(v1.threadId && v1.probeId && v1.checkpointId && v1.interruptId).toBeTruthy();
    expect(start.providerCalls).toEqual({ qdrant: 1, sherlock: 1 });

    // F5 on A: GET only, same four ids, no provider calls
    const f5 = await A.service.getView(marta);
    expect(f5).toEqual(v1);
    // Repeated start does not re-run the graph
    const again = await A.service.start(marta);
    expect(again.view).toEqual(v1);
    expect(again.providerCalls).toEqual({ qdrant: 0, sherlock: 0 });

    // Redeploy: new process B, same Neon
    const B = deploy();
    const firstGetB = await B.service.getView(marta);
    expect(firstGetB).toEqual(v1);
    expect(B.calls).toEqual({ qdrant: 0, sherlock: 0 });

    // Resume on B
    const resumed = await B.service.resume(marta, "kolejno", v1.checkpointId!);
    expect(resumed.status).toBe(200);
    const v2 = resumed.view;
    expect(v2).toMatchObject({ state: "completed", choice: "kolejno", threadId: v1.threadId, probeId: v1.probeId, interruptId: null });
    expect(v2.checkpointId).not.toBe(v1.checkpointId);
    expect(resumed.providerCalls).toEqual({ qdrant: 0, sherlock: 0 });

    // F5 after the choice
    expect(await B.service.getView(marta)).toEqual(v2);
  });

  it("repeated identical POST returns the same result; stale conflicting POST gets 409", async () => {
    const { deploy, saver } = world();
    const { service } = deploy();
    const s = "session-retry";
    const v1 = (await service.start(s)).view;
    const first = await service.resume(s, "kolejno", v1.checkpointId!);
    const count = await checkpointCount(saver, v1.threadId!);

    // Lost HTTP response → the browser retries the same request
    const retry = await service.resume(s, "kolejno", v1.checkpointId!);
    expect(retry.status).toBe(200);
    expect(retry.view).toEqual(first.view);

    const stale = await service.resume(s, "razem", v1.checkpointId!);
    expect(stale.status).toBe(409);
    expect(stale.view.choice).toBe("kolejno");
    expect(await checkpointCount(saver, v1.threadId!)).toBe(count);
  });

  it("two simultaneous clicks produce one accepted choice", async () => {
    const reference = world();
    const r = reference.deploy().service;
    const rv = (await r.start("ref")).view;
    await r.resume("ref", "razem", rv.checkpointId!);
    const expectedCount = await checkpointCount(reference.saver, rv.threadId!);

    const { deploy, saver } = world();
    const { service } = deploy();
    const v1 = (await service.start("double")).view;
    const [a, b] = await Promise.all([
      service.resume("double", "razem", v1.checkpointId!),
      service.resume("double", "razem", v1.checkpointId!),
    ]);
    expect([a.status, b.status]).toEqual([200, 200]);
    expect(a.view).toEqual(b.view);
    expect(await checkpointCount(saver, v1.threadId!)).toBe(expectedCount);

    // Conflicting simultaneous clicks: exactly one wins
    const v3 = (await service.start("double-2")).view;
    const results = await Promise.all([
      service.resume("double-2", "razem", v3.checkpointId!),
      service.resume("double-2", "kolejno", v3.checkpointId!),
    ]);
    expect(results.map((x) => x.status).sort()).toEqual([200, 409]);
    const final = await service.getView("double-2");
    expect(results.find((x) => x.status === 200)!.view.choice).toBe(final.choice);
  });

  it("isolates sessions: another session sees an empty case and cannot resume Marta's", async () => {
    const { deploy } = world();
    const { service } = deploy();
    const marta = (await service.start("session-marta")).view;

    const other = await service.getView("session-other");
    expect(other.state).toBe("empty");
    expect(other.question).toBeNull();

    // Even with Marta's checkpoint id, the other session has no case → 409, nothing leaked
    const attempt = await service.resume("session-other", "razem", marta.checkpointId!);
    expect(attempt.status).toBe(409);
    expect(attempt.view.threadId).toBeNull();
    expect((await service.getView("session-marta")).state).toBe("awaiting_choice");
  });

  describe("controlled failures", () => {
    it.each([
      ["invalid_json" as const],
      ["rate_limited" as const],
      ["timeout" as const],
    ])("Sherlock %s keeps the buttons with a fallback question", async (status) => {
      const { deploy } = world();
      const { service } = deploy({ question: { status, question: null, model: "bielik-test", ms: 5 } });
      const v = (await service.start("s")).view;
      expect(v).toMatchObject({ state: "awaiting_choice", question: FALLBACK_QUESTION, sourceId: "probe-opieka" });
      expect(v.providers.sherlock).toBe(status);
      expect(v.choices).toEqual(["razem", "kolejno"]);
    });

    it("Qdrant without a hit marks the missing source and skips the model", async () => {
      const { deploy } = world();
      const { service, calls } = deploy({ retrieval: { status: "no_hit", fragment: null, ms: 3 } });
      const v = (await service.start("s")).view;
      expect(v).toMatchObject({ state: "awaiting_choice", sourceId: null, question: FALLBACK_QUESTION });
      expect(v.providers).toEqual({ qdrant: "no_hit", sherlock: "skipped" });
      expect(calls.sherlock).toBe(0);
    });

    it("Neon write failure surfaces as an error and never confirms the choice", async () => {
      const { deploy, saver } = world();
      const { service } = deploy();
      const v1 = (await service.start("s")).view;
      saver.failWrites = true;
      await expect(service.resume("s", "kolejno", v1.checkpointId!)).rejects.toThrow();
      saver.failWrites = false;
      const after = await service.getView("s");
      expect(after.state).toBe("awaiting_choice");
      expect(after.choice).toBeNull();
      // Retry after recovery succeeds once
      const retry = await service.resume("s", "kolejno", v1.checkpointId!);
      expect(retry.view).toMatchObject({ state: "completed", choice: "kolejno" });
    });

    it("lease is released after a failure so the next request can proceed", async () => {
      const { deploy, saver } = world();
      const { service } = deploy();
      saver.failWrites = true;
      await expect(service.start("s")).rejects.toThrow();
      saver.failWrites = false;
      const v = (await service.start("s")).view;
      expect(v.state).toBe("awaiting_choice");
      expect(v.sourceId).toBe(HIT.fragment!.sourceId);
    });
  });
});
