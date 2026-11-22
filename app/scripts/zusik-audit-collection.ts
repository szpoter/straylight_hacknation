import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { corpusDigest, pointId, sha256 } from "../src/lib/rag/corpus";
import { corpusNames, loadCorpus } from "../src/lib/rag/corpus-fs";
import { DEFAULT_EMBED_MODEL, requireEnv } from "../src/lib/zusik/config";

type Metadata = { logicalId?: string; corpusVersion?: string; fragmentSha256?: string };
type Point = { id: string; payload?: Metadata };

/** Reads metadata only, including unexpected versions. Nonzero exit signals a failed release gate. */
export async function auditCollection(collection: string, mode?: "build") {
  const base = requireEnv("QDRANT_URL").replace(/\/$/, "") + "/collections/" + encodeURIComponent(collection);
  const headers = { "api-key": requireEnv("QDRANT_KNOWLEDGE_READ_KEY"), "content-type": "application/json" };
  async function request(path: string, body?: object) {
    const res = await fetch(base + path, { method: body ? "POST" : "GET", headers, redirect: "error",
      signal: AbortSignal.timeout(15000), body: body && JSON.stringify(body) });
    if (!res.ok) throw new Error("audit HTTP " + res.status);
    return res.json();
  }
  const info = await request("");
  const vectors = info.result?.config?.params?.vectors;
  const spec = vectors?.[""] ?? vectors;
  const compatible = spec?.size === 384 && spec?.distance === "Cosine";
  const manifests = corpusNames.map(name => {
    const corpus = loadCorpus(name);
    return { name, version: corpus.manifest.corpusVersion, documents: corpus.documents.size,
      fragments: corpus.fragments.size, digest: corpusDigest(corpus),
      manifestSha256: sha256(readFileSync("corpus/" + name + "/manifest.json", "utf8")) };
  });
  const expected = new Map<string, Required<Metadata>>();
  for (const name of corpusNames) {
    for (const { logicalId, corpusVersion, fragmentSha256 } of loadCorpus(name).fragments.values())
      expected.set(pointId(corpusVersion, logicalId), { logicalId, corpusVersion, fragmentSha256 });
  }
  const matched = new Set<string>();
  const seen = new Set<string>();
  const identities = new Set<string>();
  const offsets = new Set<string | number>();
  const counts: Record<string,number> = Object.create(null);
  let offset: string | number | null = null;
  let extra = 0, duplicates = 0, changed = 0;
  do {
    const page = await request("/points/scroll", { limit: 100, offset, with_vector: false,
      with_payload: ["logicalId", "corpusVersion", "fragmentSha256"] });
    if (!Array.isArray(page.result?.points) || !("next_page_offset" in page.result)) throw new Error("Invalid scroll page");
    for (const point of page.result.points as Point[]) {
      const { logicalId, corpusVersion, fragmentSha256 } = point.payload ?? {};
      const identity = JSON.stringify([corpusVersion, logicalId]);
      if (seen.has(point.id) || (logicalId && corpusVersion && identities.has(identity))) duplicates++;
      seen.add(point.id);
      identities.add(identity);
      const publicVersion = corpusVersion && (manifests.some(m => m.version === corpusVersion) ||
        /^(?:marta|(?:programy|rodzina)-[0-9]{4}-[0-9]{2})-v[0-9]{1,3}$/.test(corpusVersion));
      const group = publicVersion ? corpusVersion : "other";
      counts[group] = (counts[group] ?? 0) + 1;
      const local = expected.get(point.id);
      if (!local) extra++;
      else if (local.logicalId !== logicalId || local.corpusVersion !== corpusVersion || local.fragmentSha256 !== fragmentSha256) changed++;
      else matched.add(point.id);
    }
    offset = page.result.next_page_offset;
    if (offset !== null && offsets.has(offset)) throw new Error("Repeated scroll cursor");
    if (offset !== null) offsets.add(offset);
  } while (offset !== null);
  const versions = manifests.map(manifest => {
    const ids = [...expected].filter(([, p]) => p.corpusVersion === manifest.version).map(([id]) => id);
    return { ...manifest, matched:ids.filter(id => matched.has(id)).length, missing:ids.filter(id => !seen.has(id)).length };
  });
  const missing = versions.reduce((sum, version) => sum + version.missing, 0);
  const ok = compatible && !extra && !duplicates && !changed && !missing;
  return { commit: mode === "build" ? "build" : execFileSync("git", ["rev-parse", "HEAD"], {encoding:"utf8"}).trim(), collection,
    modelConfigured: process.env.QDRANT_EMBED_MODEL || DEFAULT_EMBED_MODEL, compatible, manifests:versions, counts,
    matched: matched.size, missing, extra, duplicates, changed, ok };
}
