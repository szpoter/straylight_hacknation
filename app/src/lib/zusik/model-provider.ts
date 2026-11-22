import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function modelHeaders(baseURL: string, env = process.env) {
  const origin = env.MODEL_TUNNEL_ORIGIN?.trim();
  if (!origin || new URL(baseURL).origin !== origin) return undefined;
  if (!origin.startsWith("https://") || !env.CF_ACCESS_CLIENT_ID || !env.CF_ACCESS_CLIENT_SECRET)
    throw new Error("Incomplete authenticated model tunnel configuration");
  return { "CF-Access-Client-Id": env.CF_ACCESS_CLIENT_ID, "CF-Access-Client-Secret": env.CF_ACCESS_CLIENT_SECRET };
}

export function chatModel(baseURL: string, apiKey: string, id: string) {
  return createOpenAICompatible({ name: "sherlock", baseURL, apiKey, headers: modelHeaders(baseURL),
    fetch: (input, init) => fetch(input, { ...init, redirect: "error" }) })(id);
}

/** Only the public RAG caller supplies the queue. Other model calls keep their provider. */
export function localRagModel(value = process.env.ZUSIK_RAG_MODEL) {
  if (!value || value === "bielik") return "bielik";
  if (value === "pllum") return "pllum";
  if (value === "hosted") return null;
  throw new Error("Unknown ZUSIK_RAG_MODEL");
}


/** Supplementary tasks require both a compatible queue consumer and an explicit role assignment. */
export function modelForTask(kind: "answer_evidence" | "plan_public" | "verify_claim", env: Record<string, string | undefined> = process.env) {
  if (kind === "answer_evidence") return localRagModel(env.ZUSIK_RAG_MODEL);
  const configured = kind === "plan_public" ? env.ZUSIK_PLANNER_MODEL : env.ZUSIK_VERIFIER_MODEL;
  if (!configured || configured === "off") return null;
  if (configured === "bielik" || configured === "pllum") return configured;
  throw Error("Unknown model for " + kind);
}
