import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pg and the LangGraph Postgres saver must stay Node.js-side, unbundled.
  serverExternalPackages: ["pg", "@langchain/langgraph-checkpoint-postgres"],
};

export default nextConfig;
