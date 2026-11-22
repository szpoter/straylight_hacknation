import { execFileSync } from "node:child_process";
import { expect, it } from "vitest";

function run(environment: string, collection: string) {
  return execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e",
    'globalThis.fetch = async () => new Response(null, {status:403}); await import("./scripts/zusik-preview-check.ts");'],
  {encoding:"utf8",env:{PATH:process.env.PATH,NODE_ENV:"test",VERCEL_ENV:environment,QDRANT_URL:"https://unused.invalid",
    QDRANT_KNOWLEDGE_COLLECTION:collection,QDRANT_KNOWLEDGE_READ_KEY:"synthetic-reader"}});
}

it("only reports safe Preview metadata, including HTTP denial and a wrong target",()=>{
  expect(run("production","unrelated")).toBe("");
  for (const [collection,expectedCollection,status] of [
    ["zusik_test_d_88db475_20261122",true,403],["other",false,"unexpected_collection"],
  ] as const) {
    expect(run("preview",collection)).toBe("ZUSIK_PREVIEW_CHECK: " +
      JSON.stringify({expectedCollection,matched:null,missing:null,extra:null,status,schemaReady:false})+"\n");
  }
});
