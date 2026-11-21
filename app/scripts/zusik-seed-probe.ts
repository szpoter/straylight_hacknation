/**
 * npm run zusik:seed-probe
 * Needs QDRANT_URL and QDRANT_WRITE_KEY (install key, never deployed to Vercel).
 * Creates or verifies collection zusik_probe_v1 (384, Cosine), upserts two points
 * with fixed ids via Cloud Inference, then checks both Polish queries by pure vector search.
 */
import { DEFAULT_EMBED_MODEL } from "../src/lib/zusik/config";
import { queryQdrant } from "../src/lib/zusik/qdrant";

const OP = "zusik:seed-probe";

const PROBE_POINTS = [
  {
    id: 1,
    sourceId: "probe-opieka",
    text: "W tej demonstracji rodzice wybierają, czy chcą opiekować się dzieckiem razem, czy kolejno.",
    check: "Czy opiekę nad dzieckiem możemy zaplanować wspólnie lub na zmianę?",
  },
  {
    id: 2,
    sourceId: "probe-rower",
    text: "Stacja naprawy rowerów ma pompkę do opon i zestaw kluczy.",
    check: "Gdzie mogę napompować koło roweru?",
  },
] as const;

function env(name: string, fallback?: string): string {
  const value = process.env[name]?.trim() || fallback;
  if (!value) {
    console.error(`${OP}: FAILED — missing ${name}`);
    process.exit(1);
  }
  return value;
}

type VectorParams = { size: number; distance: string };
type CollectionInfo = {
  result?: { config?: { params?: { vectors?: VectorParams | Record<string, VectorParams> } } };
};

async function main() {
  const url = env("QDRANT_URL").replace(/\/$/, "");
  const apiKey = env("QDRANT_WRITE_KEY");
  const collection = env("QDRANT_COLLECTION", "zusik_probe_v1");
  const model = env("QDRANT_EMBED_MODEL", DEFAULT_EMBED_MODEL);
  const headers = { "content-type": "application/json", "api-key": apiKey };
  const base = `${url}/collections/${encodeURIComponent(collection)}`;

  const existing = await fetch(base, { headers });
  if (existing.status === 404) {
    const created = await fetch(base, {
      method: "PUT",
      headers,
      body: JSON.stringify({ vectors: { size: 384, distance: "Cosine" } }),
    });
    if (!created.ok) throw new Error(`create collection HTTP ${created.status}`);
    console.log(`${OP}: created ${collection}`);
  } else if (existing.ok) {
    const vectors = ((await existing.json()) as CollectionInfo).result?.config?.params?.vectors;
    const defaultVector = vectors && ("" in vectors ? vectors[""] : vectors);
    if (defaultVector?.size !== 384 || defaultVector?.distance !== "Cosine") {
      throw new Error(`collection ${collection} exists with incompatible vectors ${JSON.stringify(vectors)}`);
    }
    console.log(`${OP}: ${collection} exists, config compatible`);
  } else {
    throw new Error(`read collection HTTP ${existing.status}`);
  }

  const upsert = await fetch(`${base}/points?wait=true`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      points: PROBE_POINTS.map((p) => ({
        id: p.id,
        vector: { text: p.text, model },
        payload: { sourceId: p.sourceId, text: p.text },
      })),
    }),
  });
  if (!upsert.ok) throw new Error(`upsert HTTP ${upsert.status}: ${(await upsert.text()).slice(0, 200)}`);

  const count = await fetch(`${base}/points/count`, {
    method: "POST",
    headers,
    body: JSON.stringify({ exact: true }),
  });
  const total = ((await count.json()) as { result?: { count?: number } }).result?.count;
  if (total !== PROBE_POINTS.length) throw new Error(`expected ${PROBE_POINTS.length} points, found ${total}`);

  for (const point of PROBE_POINTS) {
    const hit = await queryQdrant({ url, apiKey, collection, model }, point.check);
    const got = hit.fragment?.sourceId ?? hit.status;
    console.log(`${OP}: "${point.check}" → ${got} (score ${hit.fragment?.score.toFixed(3) ?? "—"}, ${hit.ms} ms)`);
    if (got !== point.sourceId) throw new Error(`expected ${point.sourceId}, got ${got}`);
  }
  console.log(`${OP}: OK · ${total} points in ${collection}`);
}

main().catch((error: Error) => {
  console.error(`${OP}: FAILED — ${error.message}`);
  process.exit(1);
});
