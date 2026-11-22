import { afterEach, expect, it, vi } from "vitest";
import { auditCollection } from "../scripts/zusik-audit-collection";
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import { pointId } from "../src/lib/rag/corpus";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it("checks paginated metadata with the reader and distinguishes missing, changed and extra points", async () => {
  vi.stubEnv("QDRANT_URL", "https://qdrant.invalid");
  vi.stubEnv("QDRANT_KNOWLEDGE_READ_KEY", "test-reader");
  const [one, two] = [...loadCorpus("marta").fragments.values()];
  const point = (f: typeof one) => ({ id: pointId(f.corpusVersion, f.logicalId), payload: f });
  const pages = [
    { points: [point(one), point({ ...two, fragmentSha256: "wrong" })], next_page_offset: 12 },
    { points: [{ ...point(one), id:"duplicate-uuid-for-one" }, { id: 49 }], next_page_offset: null },
  ];
  vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
    expect(init.headers).toMatchObject({ "api-key": "test-reader" });
    if (init.method === "GET") return Response.json({result:{ config:{ params:{ vectors:{size:384, distance:"Cosine"} } } }});
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({ offset: pages.length === 2 ? null : 12, with_vector:false,
      with_payload:["logicalId","corpusVersion","fragmentSha256"] });
    return Response.json({ result:pages.shift() });
  });
  expect(await auditCollection("test")).toMatchObject({matched:1, missing:895, changed:1, extra:2, duplicates:1, compatible:true, ok:false});
});
