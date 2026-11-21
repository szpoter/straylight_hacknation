import type { StateSnapshot } from "@langchain/langgraph";
import { CHOICES } from "./constants";
import type { ChoiceInterrupt, ProbeStateValue } from "./graph";
import type { CaseView } from "./types";

export function emptyView(threadId: string | null = null): CaseView {
  return {
    state: "empty",
    threadId,
    probeId: null,
    sourceId: null,
    model: null,
    question: null,
    choices: [],
    choice: null,
    providers: { qdrant: null, sherlock: null },
    checkpointId: null,
    interruptId: null,
    turns: [],
  };
}

/** Derives the minimal browser view from the latest checkpoint. */
export function viewFromSnapshot(threadId: string, snapshot: StateSnapshot, leaseActive: boolean): CaseView {
  const values = (snapshot.values ?? {}) as Partial<ProbeStateValue>;
  const checkpointId = (snapshot.config?.configurable?.checkpoint_id as string | undefined) ?? null;
  const pending = snapshot.tasks.flatMap((task) => task.interrupts)[0];

  if (!checkpointId && !values.probeId) {
    return { ...emptyView(threadId), state: leaseActive ? "starting" : "empty" };
  }

  const base: CaseView = {
    state: "starting",
    threadId,
    probeId: values.probeId ?? null,
    sourceId: values.sourceId ?? null,
    model: values.model ?? null,
    question: values.question ?? null,
    choices: [],
    choice: values.choice ?? null,
    providers: { qdrant: values.qdrantStatus ?? null, sherlock: values.sherlockStatus ?? null },
    checkpointId,
    interruptId: null,
    turns: [],
  };

  if (pending) {
    const payload = pending.value as ChoiceInterrupt | undefined;
    return {
      ...base,
      state: "awaiting_choice",
      // A choice is only accepted once the graph has finished; never show a half-saved one.
      choice: null,
      question: payload?.question ?? base.question,
      choices: payload?.choices ?? [...CHOICES],
      interruptId: pending.id ?? null,
    };
  }
  if (values.choice && snapshot.next.length === 0) return { ...base, state: "completed" };
  return base;
}

export function isFresh(snapshot: StateSnapshot): boolean {
  const checkpointId = snapshot.config?.configurable?.checkpoint_id;
  return !checkpointId && snapshot.next.length === 0;
}
