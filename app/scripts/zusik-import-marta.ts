/**
 * npm run zusik:import-marta
 * Needs QDRANT_URL and QDRANT_WRITE_KEY (operator key, never deployed).
 * Optional QDRANT_KNOWLEDGE_COLLECTION (default zusik_marta_v1) and QDRANT_KNOWLEDGE_READ_KEY
 * (the app's key: checked for read access and for NOT having write access).
 *
 * 1. validates manifest + fragments (ids, links, locators, hashes, official URLs);
 * 2. creates or checks the collection (one default vector 384, Cosine; "" key from the dashboard accepted);
 * 3. creates keyword payload indexes for filtered fields before writing;
 * 4. refuses to change content of an already imported version (bump corpusVersion instead);
 * 5. upserts stable UUIDs (version + logicalId) in one batch with wait=true, via Cloud Inference;
 * 6. reads everything back and compares ids + hashes with the local digest.
 * Re-running with the same version is idempotent: same ids, same hashes.
 */
import { readFileSync } from "node:fs";
import sources from "../corpus/official-sources.json";
import { DEFAULT_EMBED_MODEL } from "../src/lib/zusik/config";
import { corpusDigest, embeddingText, pointId, sha256, withoutFragments } from "../src/lib/rag/corpus";
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import { extractOfficialParagraph } from "../src/lib/rag/official-sections";

// Explicit destination is useful when a deployment has its own collection-scoped reader.
const corpusName = process.argv.find((arg) => arg.startsWith("--corpus="))?.slice(9) ?? "marta";
if (!["marta", "publiczne", "oferta"].includes(corpusName)) throw new Error("Unknown public corpus");
const collectionOverride = process.argv.find((arg) => arg.startsWith("--collection="))?.slice(13);
const OP = `zusik:import-${corpusName}`;
const INDEXED_FIELDS = ["corpusVersion", "logicalId", "topic"] as const;

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
  result?: {
    config?: { params?: { vectors?: VectorParams | Record<string, VectorParams> } };
    payload_schema?: Record<string, { data_type?: string }>;
  };
};
type ScrollResponse = {
  result?: { points?: Array<{ id: string; payload?: { logicalId?: string; fragmentSha256?: string } }>; next_page_offset?: string | null };
};

async function main() {
  const complete = loadCorpus(corpusName);
  for (const source of sources.filter((s) => complete.documents.has(s.sourceId))) {
    const snapshot = readFileSync(`corpus/${source.snapshot}`, "utf8");
    if (sha256(snapshot) !== source.snapshotSha256) throw new Error(`Snapshot digest mismatch: ${source.sourceId}`);
    for (const { heading, fragmentId, paragraphStarts } of source.sections) {
      if (extractOfficialParagraph(snapshot, heading, paragraphStarts) !== complete.fragments.get(fragmentId)?.sourceText) {
        throw new Error(`Snapshot paragraph mismatch: ${fragmentId}`);
      }
    }
  }
  const omitted = process.argv.find((arg) => arg.startsWith("--omit-test-fragment="))?.split("=")[1];
  if (omitted && (!collectionOverride?.startsWith("zusik_test_") ||
      [process.env.QDRANT_COLLECTION, process.env.QDRANT_KNOWLEDGE_COLLECTION].includes(collectionOverride) ||
      !complete.fragments.has(omitted))) {
    throw new Error("Omitting a fragment requires a known ID and an isolated zusik_test_ collection");
  }
  const corpus = omitted ? withoutFragments(complete, [omitted]) : complete;
  const version = corpus.manifest.corpusVersion;
  console.log(`${OP}: manifest ${version} OK · ${corpus.documents.size} documents · ${corpus.fragments.size} units · digest ${corpusDigest(corpus).slice(0, 16)}`);

  const url = env("QDRANT_URL").replace(/\/$/, "");
  const writeKey = env("QDRANT_WRITE_KEY");
  const collection = collectionOverride || (process.env.QDRANT_KNOWLEDGE_READ_KEY && process.env.QDRANT_KNOWLEDGE_COLLECTION?.trim()) || env("QDRANT_COLLECTION");
  const model = env("QDRANT_EMBED_MODEL", DEFAULT_EMBED_MODEL);
  const headers = { "content-type": "application/json", "api-key": writeKey };
  const base = `${url}/collections/${encodeURIComponent(collection)}`;

  // 2. collection
  const existing = await fetch(base, { headers });
  let info: CollectionInfo;
  if (existing.status === 404) {
    const created = await fetch(base, { method: "PUT", headers, body: JSON.stringify({ vectors: { size: 384, distance: "Cosine" } }) });
    if (!created.ok) throw new Error(`create collection HTTP ${created.status}: ${(await created.text()).slice(0, 200)}`);
    console.log(`${OP}: created ${collection} (384, Cosine)`);
    info = (await (await fetch(base, { headers })).json()) as CollectionInfo;
  } else if (existing.ok) {
    info = (await existing.json()) as CollectionInfo;
    const vectors = info.result?.config?.params?.vectors;
    const defaultVector = vectors && ("" in vectors ? (vectors as Record<string, VectorParams>)[""] : (vectors as VectorParams));
    if (defaultVector?.size !== 384 || defaultVector?.distance !== "Cosine") {
      throw new Error(`collection ${collection} exists with incompatible vectors ${JSON.stringify(vectors)}`);
    }
    console.log(`${OP}: ${collection} exists, default vector 384/Cosine`);
  } else {
    throw new Error(`read collection HTTP ${existing.status}`);
  }

  // 3. payload indexes before any write (strict mode requires them for filters)
  for (const field of INDEXED_FIELDS) {
    if (info.result?.payload_schema?.[field]?.data_type === "keyword") continue;
    const res = await fetch(`${base}/index?wait=true`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ field_name: field, field_schema: "keyword" }),
    });
    if (!res.ok) throw new Error(`index ${field} HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    console.log(`${OP}: payload index ${field}: keyword`);
  }

  // 4. never silently change an imported version
  const before = await readVersion(base, headers, version);
  const local = new Map([...corpus.fragments.values()].map((f) => [f.logicalId, f.fragmentSha256]));
  const changed = [...before].filter(([id, hash]) => local.get(id) !== hash).map(([id]) => id);
  if (changed.length) {
    throw new Error(`version ${version} already holds different content for: ${changed.join(", ")}. Bump corpusVersion.`);
  }
  console.log(`${OP}: before import: ${before.size} points of ${version}`);

  // 5. one batch, stable ids, wait=true
  const points = [...corpus.fragments.values()].filter((f) => !before.has(f.logicalId)).map((f) => {
    const doc = corpus.documents.get(f.documentId)!;
    return {
      id: pointId(version, f.logicalId),
      vector: { text: embeddingText(corpus, f), model },
      payload: {
        logicalId: f.logicalId,
        corpusVersion: version,
        documentId: f.documentId,
        locator: f.locator,
        page: f.page,
        headingPath: f.headingPath,
        topic: f.topic,
        authority: doc.authority,
        locale: f.locale,
        fragmentSha256: f.fragmentSha256,
        validFrom: doc.validFrom,
        validTo: doc.validTo,
        text: f.sourceText,
      },
    };
  });
  const started = Date.now();
  const batchSize = 16;
  for (let start = 0; start < points.length; start += batchSize) {
    const batch = points.slice(start, start + batchSize);
    const upsert = await fetch(`${base}/points?wait=true`, { method: "PUT", headers, body: JSON.stringify({ points: batch }), signal: AbortSignal.timeout(90_000) });
    if (!upsert.ok) throw new Error(`upsert HTTP ${upsert.status}, batch ${start / batchSize + 1}`);
    console.log(`${OP}: ${start + batch.length}/${points.length} new points`);
  }
  console.log(`${OP}: upserted ${points.length} new points in ${Date.now() - started} ms`);

  // 6. read back and compare
  const after = await readVersion(base, headers, version);
  const missing = [...local.keys()].filter((id) => after.get(id) !== local.get(id));
  const extra = [...after.keys()].filter((id) => !local.has(id));
  if (missing.length || extra.length) throw new Error(`read-back mismatch · missing/changed: ${missing.join(", ")} · extra: ${extra.join(", ")}`);
  const remoteDigest = corpusDigest({ ...corpus, fragments: new Map([...after].map(([id, hash]) => [id, { ...corpus.fragments.get(id)!, fragmentSha256: hash }])) });
  console.log(`${OP}: read-back ${after.size} points · ids+hashes identical · remote digest ${remoteDigest.slice(0, 16)}`);

  await checkAppKey(base, version, model, collection);
  console.log(`${OP}: OK · ${version} in ${collection}`);
}

async function readVersion(base: string, headers: Record<string, string>, version: string): Promise<Map<string, string>> {
  const filter = { must: [{ key: "corpusVersion", match: { value: version } }] };
  const found = new Map<string, string>();
  let offset: string | null | undefined;
  do {
    const res = await fetch(`${base}/points/scroll`, {
      method: "POST",
      headers,
      body: JSON.stringify({ filter, limit: 100, with_payload: ["logicalId", "fragmentSha256"], with_vector: false, offset }),
    });
    if (!res.ok) throw new Error(`scroll HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const body = (await res.json()) as ScrollResponse;
    for (const p of body.result?.points ?? []) {
      const { logicalId, fragmentSha256 } = p.payload ?? {};
      if (!logicalId || !fragmentSha256 || p.id !== pointId(version, logicalId) || found.has(logicalId)) {
        throw new Error(`Invalid or duplicate point ID in ${version}: ${p.id}`);
      }
      found.set(logicalId, fragmentSha256);
    }
    offset = body.result?.next_page_offset;
  } while (offset);
  return found;
}

/** The app key must read this collection and must not be able to write it. */
async function checkAppKey(base: string, version: string, model: string, collection: string) {
  const readKey = collection === process.env.QDRANT_KNOWLEDGE_COLLECTION ? process.env.QDRANT_KNOWLEDGE_READ_KEY : collection === process.env.QDRANT_COLLECTION ? process.env.QDRANT_READ_KEY : undefined;
  if (!readKey) {
    console.log(`${OP}: QDRANT_KNOWLEDGE_READ_KEY not set — app key scope not checked`);
    return;
  }
  const headers = { "content-type": "application/json", "api-key": readKey };
  const read = await fetch(`${base}/points/query`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query: { text: "wniosek o urlop rodzicielski", model },
      filter: { must: [{ key: "corpusVersion", match: { value: version } }] },
      limit: 1,
    }),
  });
  if (!read.ok) throw new Error(`app key cannot read the knowledge collection (HTTP ${read.status})`);
  const write = await fetch(`${base}/points/payload?wait=true`, {
    method: "POST",
    headers,
    body: JSON.stringify({ payload: { scopeProbe: true }, points: ["00000000-0000-5000-8000-000000000000"] }),
  });
  // 404 (point not found) would mean the key passed authorisation, i.e. it has write scope.
  if (write.status !== 401 && write.status !== 403) {
    throw new Error(`app key is not read-only for this collection (write probe HTTP ${write.status}) — issue a read-only key`);
  }
  console.log(`${OP}: app key reads (HTTP ${read.status}) and cannot write (HTTP ${write.status})`);
}

main().catch((error: Error) => {
  console.error(`${OP}: FAILED — ${error.message}`);
  process.exit(1);
});
