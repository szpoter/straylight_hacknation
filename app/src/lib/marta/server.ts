import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { runtime } from "../zusik/server";
import { PgCaseStore } from "../zusik/case-store";
import { OLA } from "../family/ola";
import { applyMarta } from "./case";
import type { Command, MartaView } from "./types";

const state = Annotation.Root({ view: Annotation<MartaView | null> });
function service() {
  const { pool, checkpointer } = runtime();
  const graph = new StateGraph(state).addNode("save", s => ({ view: s.view })).addEdge(START, "save").addEdge("save", END).compile({ checkpointer });
  return { graph, store: new PgCaseStore(pool) };
}
export async function readMarta(session: string, command?: Command) {
  const { graph, store } = service();
  const record = command ? await store.findOrCreate(session) : await store.findBySession(session);
  if (!record) return { status: 200, view: null };
  const configFor = (suffix: string) => ({ configurable: { thread_id: record.threadId + suffix }, durability: "sync" as const });
  const token = randomUUID();
  if (command) {
    const limit = Date.now() + 3000;
    while (!await store.acquireLease(record.threadId, token)) {
      if (Date.now() >= limit) return { status: 409, error: "busy", view: undefined };
      await delay(120);
    }
  }
  try {
    let config = configFor(":marta:ola");
    let snapshot = await graph.getState(config);
    if (!snapshot.values.view) {
      const previousConfig = configFor(":marta");
      const previous = await graph.getState(previousConfig);
      const family = previous.values.view as MartaView | undefined;
      if (family?.firstName === OLA.mother && family.secondName === OLA.father && family.childName === OLA.child
        && (!family.childBirthDate || family.childBirthDate === OLA.birthDate)) {
        config = previousConfig;
        snapshot = previous;
      }
    }
    const view: MartaView | null = snapshot.values.view ?? null;
    if (!command) return { status: 200, view, savedAt: snapshot.createdAt };
    const result = applyMarta(view, command);
    if (result.status === 200) await graph.invoke({ view: result.view }, config);
    return result;
  } finally {
    if (command) await store.releaseLease(record.threadId, token);
  }
}
