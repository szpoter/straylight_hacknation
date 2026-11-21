import { Annotation, END, START, StateGraph, interrupt, type BaseCheckpointSaver } from "@langchain/langgraph";
import { z } from "zod";
import { CHOICES, FALLBACK_QUESTION, PROBE_QUERY, type Choice } from "./constants";
import type { ProbeProviders, QdrantStatus, SherlockStatus } from "./types";

export const ProbeState = Annotation.Root({
  probeId: Annotation<string>,
  sourceId: Annotation<string | null>,
  model: Annotation<string | null>,
  question: Annotation<string | null>,
  qdrantStatus: Annotation<QdrantStatus | null>,
  sherlockStatus: Annotation<SherlockStatus | null>,
  choice: Annotation<Choice | null>,
});

export type ProbeStateValue = typeof ProbeState.State;

export interface ChoiceInterrupt {
  question: string;
  choices: Choice[];
}

const choiceSchema = z.enum(CHOICES);

/**
 * probeProviders → awaitChoice → END.
 * Compiled per request so provider calls can be counted and mocked;
 * all persistent state lives in the checkpointer (PostgresSaver on Neon).
 */
export function buildProbeGraph(providers: ProbeProviders, checkpointer: BaseCheckpointSaver) {
  return new StateGraph(ProbeState)
    .addNode("probeProviders", async () => {
      const retrieval = await providers.retrieve(PROBE_QUERY);
      if (retrieval.status !== "ok" || !retrieval.fragment) {
        // No grounded fragment: do not ask the model, mark the missing source.
        return {
          sourceId: null,
          model: null,
          question: FALLBACK_QUESTION,
          qdrantStatus: retrieval.status,
          sherlockStatus: "skipped" as const,
          choice: null,
        };
      }
      const asked = await providers.askQuestion(retrieval.fragment.text);
      return {
        sourceId: retrieval.fragment.sourceId,
        model: asked.model,
        question: asked.question ?? FALLBACK_QUESTION,
        qdrantStatus: retrieval.status,
        sherlockStatus: asked.status,
        choice: null,
      };
    })
    .addNode("awaitChoice", (state) => {
      // This node re-runs from the top on resume: nothing before interrupt() may have side effects.
      const resumed = interrupt<ChoiceInterrupt, unknown>({
        question: state.question ?? FALLBACK_QUESTION,
        choices: [...CHOICES],
      });
      return { choice: choiceSchema.parse(resumed) };
    })
    .addEdge(START, "probeProviders")
    .addEdge("probeProviders", "awaitChoice")
    .addEdge("awaitChoice", END)
    .compile({ checkpointer });
}
