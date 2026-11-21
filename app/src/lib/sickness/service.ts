import { createHash, randomUUID } from "node:crypto";
import { Annotation, END, START, StateGraph, type BaseCheckpointSaver } from "@langchain/langgraph";
import { z } from "zod";
import { assessSicknessCase, evidenceId } from "../rules/sickness";
import type { CaseStore } from "../zusik/case-store";
import { labels, packetA, parsePage } from "./read";
import type { Answer, Law, PageFact, SicknessView } from "./types";

const version = z.number().int().positive();
export const mutationSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("start") }),
  z.strictObject({ type: z.literal("close"), version }),
  z.strictObject({ type: z.literal("confirm"), version, answer: z.enum(["yes", "no", "unknown"]) }),
  z.strictObject({ type: z.literal("evidence"), version, includeEmployment: z.boolean() }),
  z.strictObject({
    type: z.literal("import"),
    version,
    pages: z
      .array(
        z.union([
          z.string().min(1).max(2000),
          z.strictObject({
            page: z.number().int().min(1).max(6),
            text: z.string().min(1).max(2000),
            manual: z.boolean(),
          }),
        ]),
      )
      .min(1)
      .max(6),
  }),
]);
type Mutation = z.infer<typeof mutationSchema>;
interface CaseRecord {
  packet: PageFact[];
  view: SicknessView;
  lastMutation: string;
}
const State = Annotation.Root({ record: Annotation<CaseRecord> });
export class InvalidPacket extends Error {}

export class SicknessService {
  private readonly graph;
  constructor(
    private readonly store: CaseStore,
    saver: BaseCheckpointSaver,
    private readonly searchLaw: () => Promise<Law[]>,
  ) {
    this.graph = new StateGraph(State)
      .addNode("saveAssessment", (s) => ({ record: s.record }))
      .addEdge(START, "saveAssessment")
      .addEdge("saveAssessment", END)
      .compile({ checkpointer: saver });
  }
  private config(threadId: string) {
    return { configurable: { thread_id: "sickness:" + threadId }, durability: "sync" as const };
  }
  private async read(threadId: string): Promise<CaseRecord | null> {
    const snapshot = await this.graph.getState(this.config(threadId));
    return (snapshot.values as Partial<typeof State.State>).record ?? null;
  }
  async get(session: string) {
    const owner = await this.store.findBySession(session);
    return owner ? ((await this.read(owner.threadId))?.view ?? null) : null;
  }
  async evidence(session: string, id: string) {
    const owner = await this.store.findBySession(session);
    const current = owner && (await this.read(owner.threadId));
    const doc = current?.view.evidence.find((e) => e.url.endsWith("/" + id));
    return (doc && current?.packet.find((p) => evidenceId(p) === doc.id)) || null;
  }
  async change(session: string, action: Mutation): Promise<{ status: number; view: SicknessView | null }> {
    const owner =
      action.type === "start" ? await this.store.findOrCreate(session) : await this.store.findBySession(session);
    if (!owner) return { status: 404, view: null };
    const token = randomUUID();
    if (!(await this.store.acquireLease(owner.threadId, token)))
      return { status: 409, view: await this.get(session) };
    try {
      const current = await this.read(owner.threadId);
      const key = createHash("sha256").update(JSON.stringify(action)).digest("hex");
      if (current && (action.type === "start" || current.lastMutation === key))
        return { status: 200, view: current.view };
      if (action.type !== "start" && (!current || current.view.version !== action.version))
        return { status: 409, view: current?.view ?? null };
      if (action.type === "close" && current?.view.assessment.status !== "not_entitled_for_period")
        return { status: 422, view: current?.view ?? null };
      let packet = current?.packet ?? packetA;
      let otherCoverage: Answer | null = current?.view.otherCoverage ?? null;
      let includeEmployment = current?.view.includeEmployment ?? true;
      if (action.type === "import") {
        try {
          packet = action.pages.map((p, i) =>
            typeof p === "string" ? parsePage(p, i + 1) : { ...parsePage(p.text, p.page), manual: p.manual },
          );
          if (new Set(packet.map((p) => p.page)).size !== packet.length) throw new InvalidPacket();
        } catch {
          throw new InvalidPacket();
        }
        includeEmployment = packet.some((p) => p.kind === "employment");
        otherCoverage = null;
      }
      if (action.type === "confirm") otherCoverage = action.answer;
      if (action.type === "evidence")
        includeEmployment = action.includeEmployment && packet.some((p) => p.kind === "employment");
      const pages = packet.filter((p) => includeEmployment || p.kind !== "employment");
      const law = action.type === "close" && current ? current.view.assessment.law : await this.searchLaw();
      const view: SicknessView = {
        version: (current?.view.version ?? 0) + 1,
        closed: action.type === "close",
        includeEmployment,
        otherCoverage,
        canRestoreEmployment: packet.some((p) => p.kind === "employment"),
        assessment: assessSicknessCase({ pages, otherCoverage }, law),
        evidence: pages.map((p) => {
          const id = evidenceId(p);
          const locator = createHash("sha256")
            .update(owner.threadId + "|" + p.text + "|" + p.page)
            .digest("hex");
          return { id, title: labels[p.kind], page: p.page, url: "/api/zusik/sickness/evidence/" + locator };
        }),
      };
      await this.graph.invoke({ record: { packet, view, lastMutation: key } }, this.config(owner.threadId));
      return { status: 200, view };
    } finally {
      await this.store.releaseLease(owner.threadId, token);
    }
  }
}
