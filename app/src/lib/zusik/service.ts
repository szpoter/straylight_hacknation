import { randomBytes } from "node:crypto";
import { Command, type BaseCheckpointSaver } from "@langchain/langgraph";
import type { Choice } from "./constants";
import type { CaseStore } from "./case-store";
import { buildProbeGraph } from "./graph";
import type { CaseView, ProbeProviders } from "./types";
import { emptyView, isFresh, viewFromSnapshot } from "./view";

export interface ProviderCalls {
  qdrant: number;
  sherlock: number;
}

export interface ServiceResult {
  status: 200 | 202 | 409;
  view: CaseView;
  providerCalls: ProviderCalls;
}

export interface ProbeServiceDeps {
  store: CaseStore;
  checkpointer: BaseCheckpointSaver;
  providers: ProbeProviders;
  /** How long a request waits for another request's lease. */
  leaseWaitMs?: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function newToken(): string {
  return randomBytes(12).toString("base64url");
}

export class ProbeService {
  constructor(private readonly deps: ProbeServiceDeps) {}

  /** Wraps providers so each request reports how many external calls it made. */
  private graph() {
    const calls: ProviderCalls = { qdrant: 0, sherlock: 0 };
    const { providers } = this.deps;
    const counted: ProbeProviders = {
      retrieve: (query) => {
        calls.qdrant += 1;
        return providers.retrieve(query);
      },
      askQuestion: (text) => {
        calls.sherlock += 1;
        return providers.askQuestion(text);
      },
    };
    return { graph: buildProbeGraph(counted, this.deps.checkpointer), calls };
  }

  private config(threadId: string) {
    return { configurable: { thread_id: threadId }, durability: "sync" as const };
  }

  /** GET: reads the checkpoint, never creates anything. */
  async getView(sessionId: string): Promise<CaseView> {
    const demoCase = await this.deps.store.findBySession(sessionId);
    if (!demoCase) return emptyView();
    const { graph } = this.graph();
    const snapshot = await graph.getState(this.config(demoCase.threadId));
    return viewFromSnapshot(demoCase.threadId, snapshot, demoCase.leaseActive);
  }

  private async withLease<T>(threadId: string, run: () => Promise<T>): Promise<T | "busy"> {
    const token = newToken();
    const deadline = Date.now() + (this.deps.leaseWaitMs ?? 6_000);
    while (!(await this.deps.store.acquireLease(threadId, token))) {
      if (Date.now() >= deadline) return "busy";
      await sleep(150);
    }
    try {
      return await run();
    } finally {
      await this.deps.store.releaseLease(threadId, token);
    }
  }

  /** Starts the probe once per session; a retry continues the saved run. */
  async start(sessionId: string): Promise<ServiceResult> {
    const demoCase = await this.deps.store.findOrCreate(sessionId);
    const { graph, calls } = this.graph();
    const config = this.config(demoCase.threadId);
    const outcome = await this.withLease(demoCase.threadId, async () => {
      const snapshot = await graph.getState(config);
      const view = viewFromSnapshot(demoCase.threadId, snapshot, true);
      if (isFresh(snapshot)) {
        await graph.invoke(
          {
            probeId: `p_${randomBytes(9).toString("base64url")}`,
            sourceId: null,
            model: null,
            question: null,
            qdrantStatus: null,
            sherlockStatus: null,
            choice: null,
          },
          config,
        );
      } else if (view.state === "starting") {
        // A previous start lost its process mid-run: continue from the last checkpoint.
        await graph.invoke(null, config);
      }
      return viewFromSnapshot(demoCase.threadId, await graph.getState(config), false);
    });
    if (outcome === "busy") {
      return { status: 202, view: await this.getView(sessionId), providerCalls: calls };
    }
    return { status: 200, view: outcome, providerCalls: calls };
  }

  /**
   * Resumes the pending interrupt once. Same choice repeated → same result;
   * a different choice from a stale tab → 409 with the current view.
   */
  async resume(sessionId: string, choice: Choice, expectedCheckpointId: string): Promise<ServiceResult> {
    const demoCase = await this.deps.store.findBySession(sessionId);
    const { graph, calls } = this.graph();
    if (!demoCase) return { status: 409, view: emptyView(), providerCalls: calls };
    const config = this.config(demoCase.threadId);
    const outcome = await this.withLease(demoCase.threadId, async () => {
      const view = viewFromSnapshot(demoCase.threadId, await graph.getState(config), true);
      if (view.state === "completed") {
        return { status: view.choice === choice ? 200 : 409, view } as const;
      }
      if (view.state !== "awaiting_choice" || view.checkpointId !== expectedCheckpointId) {
        return { status: 409, view } as const;
      }
      await graph.invoke(new Command({ resume: choice }), config);
      const after = viewFromSnapshot(demoCase.threadId, await graph.getState(config), false);
      return { status: 200, view: after } as const;
    });
    if (outcome === "busy") {
      return { status: 202, view: await this.getView(sessionId), providerCalls: calls };
    }
    return { ...outcome, providerCalls: calls };
  }
}
