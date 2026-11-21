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
