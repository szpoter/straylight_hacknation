import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pg and the LangGraph Postgres saver must stay Node.js-side, unbundled.
  serverExternalPackages: ["pg", "@langchain/langgraph-checkpoint-postgres"],
  // The ask route reads the public corpus (manifest + fragments) from disk at runtime.
  outputFileTracingIncludes: { "/api/zusik/**": ["./corpus/marta/manifest.json", "./corpus/marta/fragments.jsonl"] },
};

export default nextConfig;
