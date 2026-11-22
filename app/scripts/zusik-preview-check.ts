import { Client } from "pg";
import { auditCollection } from "./zusik-audit-collection";
import { ConfigError } from "../src/lib/zusik/config";

const expected = "zusik_test_d_88db475_20261122";
const tables = ["demo_cases", "ask_turns", "v1_profiles", "v1_cases", "v1_subjects", "v1_account_links",
  "v1_documents", "v1_facts", "v1_proposals", "v1_turns", "v1_requests", "v1_responses"];

async function schemaReady() {
  if (!process.env.DATABASE_URL) return false;
  const db = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000, query_timeout: 5000 });
  try {
    await db.connect();
    const result = await db.query("SELECT to_regclass(name) AS relation FROM unnest($1::text[]) AS t(name)",
      [tables.map(name => "zusik." + name)]);
    return result.rows.length === tables.length && result.rows.every(r => r.relation !== null);
  } finally {
    await db.end();
  }
}

async function collectionResult() {
  const expectedCollection = process.env.QDRANT_KNOWLEDGE_COLLECTION?.trim() === expected;
  const unknown = { expectedCollection, matched: null, missing: null, extra: null };
  if (!expectedCollection) return { ...unknown, status: "unexpected_collection" };
  try {
    const audit = await auditCollection(expected, "build");
    return { expectedCollection, matched: audit.matched, missing: audit.missing, extra: audit.extra,
      status: audit.ok ? 200 : "parity_mismatch" };
  } catch (error) {
    const http = error instanceof Error && /^audit HTTP ([1-5]\d\d)$/.exec(error.message);
    return { ...unknown, status: http ? Number(http[1]) : error instanceof ConfigError ? "missing_configuration" : "audit_unavailable" };
  }
}

if (process.env.VERCEL_ENV === "preview") {
  void Promise.all([collectionResult(), schemaReady().catch(() => false)]).then(([collection, schemaReady]) => {
    console.log("ZUSIK_PREVIEW_CHECK: " + JSON.stringify({ ...collection, schemaReady }));
  });
}
