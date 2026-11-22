import { DEFAULT_EMBED_MODEL } from "../zusik/config";
import { isPrimary, isValidOn, pointId, type Corpus, type Fragment } from "./corpus";
import { corpusNames, loadCorpus } from "./corpus-fs";

/** Cloud Inference embeds the query; the first call after idle can take several seconds. */
export const KNOWLEDGE_TIMEOUT_MS = 10_000;

/** One vector hit as returned by Qdrant, before joining with the local corpus. */
export interface VectorHit {
  corpusVersion?: string;
  logicalId: string;
  fragmentSha256: string;
  score: number;
}
export type CorpusCandidate = Omit<VectorHit, "score" | "corpusVersion"> & { corpusVersion: string };

export interface VectorSearchResult {
  status: "ok" | "error";
  hits: VectorHit[];
  rankings?: { dense: string[]; lexical: string[] };
  ms: number;
}

/** External search. Injected so tests and the eval can control it. */
export interface KnowledgeSearch {
  search(input: { query: string; expanded: string | null; corpusVersion: string; limit: number; lexical?: CorpusCandidate[]; asOf?: string }): Promise<VectorSearchResult>;
}

export interface KnowledgeSettings {
  url: string;
  apiKey: string;
  collection: string;
  model?: string;
  fetchImpl?: typeof fetch;
}

interface RemotePoint { id: string | number; score?: number; payload?: Record<string, unknown> }

function fuseRanks(lexical: VectorHit[], dense: VectorHit[], limit: number) {
  const scores = new Map<string, VectorHit>();
  for (const list of [lexical, dense]) {
    list.forEach((hit, rank) => {
      const key = hit.corpusVersion + ":" + hit.logicalId;
      const score = (scores.get(key)?.score ?? 0) + 1 / (rank + 2);
      scores.set(key, { ...hit, score });
    });
  }
  return [...scores.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Qdrant Cloud Inference search filtered to one corpus version.
 * With an expanded query, both texts are prefetched and fused with RRF.
 */
export function qdrantKnowledgeSearch(settings: KnowledgeSettings): KnowledgeSearch {
  const doFetch = settings.fetchImpl ?? fetch;
  const model = settings.model ?? DEFAULT_EMBED_MODEL;
  return {
    async search({ query, expanded, corpusVersion, limit, lexical, asOf = new Date().toISOString().slice(0, 10) }) {
      const started = Date.now();
      const signal = AbortSignal.timeout(KNOWLEDGE_TIMEOUT_MS);
      const url = settings.url.replace(/\/$/, "") + "/collections/" + encodeURIComponent(settings.collection) + "/points";
      async function post(path: string, input: object) {
        const response = await doFetch(url + path, { method: "POST", headers: { "content-type": "application/json", "api-key": settings.apiKey },
          body: JSON.stringify(input), signal, cache: "no-store" });
        if (!response.ok) throw new Error("Qdrant HTTP " + response.status);
        return response.json();
      }
      const filter = { must: [{ key: "corpusVersion", match: { value: corpusVersion } }] };
      const body = expanded
        ? {
            prefetch: [
              { query: { text: query, model }, filter, limit: limit * 2 },
              { query: { text: expanded, model }, filter, limit: limit * 2 },
            ],
            query: { fusion: "rrf" },
            limit,
            with_payload: ["logicalId", "fragmentSha256"],
          }
        : { query: { text: query, model }, filter, limit, with_payload: ["logicalId", "fragmentSha256"] };
      try {
        if (lexical?.length) {
          const active = new Map(corpusNames.map(name => {
            const corpus = loadCorpus(name);
            return [corpus.manifest.corpusVersion, corpus];
          }));
          const payload = ["logicalId", "fragmentSha256", "corpusVersion"];
          const ids = lexical.slice(0, 20).map(hit => pointId(hit.corpusVersion, hit.logicalId));
          const [nearest, confirmed] = await Promise.all([
            post("/query", { query: { text: query, model }, filter: { must: [{ key: "corpusVersion", match: { any: [...active.keys()] } }] },
              limit: 20, with_payload: payload }),
            post("", { ids, with_payload: payload, with_vector: false }),
          ]);
          function verified(point: RemotePoint): VectorHit[] {
            const { logicalId, fragmentSha256, corpusVersion: version } = point.payload ?? {};
            if (typeof logicalId !== "string" || typeof version !== "string" || typeof fragmentSha256 !== "string") return [];
            const corpus = active.get(version);
            const f = corpus?.fragments.get(logicalId);
            return corpus && f && f.fragmentSha256 === fragmentSha256 && point.id === pointId(version, logicalId) && isValidOn(corpus, f, asOf)
              ? [{ logicalId, fragmentSha256, corpusVersion: version, score: point.score ?? 0 }] : [];
          }
          const received = new Map<string | number, RemotePoint>((confirmed.result as RemotePoint[]).map(p => [p.id, p]));
          const words = ids.flatMap(id => { const p = received.get(id); return p ? verified(p) : []; });
          const dense = (nearest.result.points as RemotePoint[]).flatMap(verified);
          return { status: "ok", hits: fuseRanks(words, dense, limit), ms: Date.now() - started,
            rankings: { lexical: words.map(f => f.logicalId), dense: dense.map(f => f.logicalId) } };
        }
        const points: RemotePoint[] = (await post("/query", body)).result?.points ?? [];
        const hits = points.flatMap((p) => {
          const logicalId = p.payload?.logicalId;
          const hash = p.payload?.fragmentSha256;
          return typeof logicalId === "string" && typeof hash === "string"
            ? [{ logicalId, fragmentSha256: hash, score: p.score ?? 0 }]
            : [];
        });
        return { status: "ok", hits, ms: Date.now() - started };
      } catch (error) {
        console.error(JSON.stringify({ event: "knowledge_qdrant_error", error: (error as Error).name }));
        return { status: "error", hits: [], ms: Date.now() - started };
      }
    },
  };
}

export type EvidenceVia = "locator" | "vector" | "related" | "primary";

export interface EvidenceItem {
  fragment: Fragment;
  via: EvidenceVia;
  score: number | null;
}

export interface Evidence {
  /** Top hits from the vector search that exist in the local active corpus (raw Hit@k). */
  vectorIds: string[];
  /** Final list handed to the model, in order. */
  items: EvidenceItem[];
}

export const TOP_K = 5;
export const MAX_EVIDENCE = 8;

/**
 * Joins vector hits with the local corpus and adds what must travel with them:
 * explicit locators first, then hits, their related exceptions and the primary law
 * behind guidance. Guidance whose primary law is present is dropped (cite the source).
 * A hit whose hash differs from the local fragment is ignored (stale or partial import).
 */
export function assembleEvidence(
  corpus: Corpus,
  hits: VectorHit[],
  options: { locatorKeys?: string[]; asOf: string; excludeTopics?: string[] },
): Evidence {
  const excluded = new Set(options.excludeTopics ?? []);
  const usable = (f: Fragment | undefined): f is Fragment =>
    !!f && isValidOn(corpus, f, options.asOf) && !excluded.has(f.topic);
  const items: EvidenceItem[] = [];
  const seen = new Set<string>();
  const add = (f: Fragment | undefined, via: EvidenceVia, score: number | null) => {
    if (!usable(f) || seen.has(f.logicalId)) return;
    seen.add(f.logicalId);
    items.push({ fragment: f, via, score });
  };

  // An empty remote partition (or only stale hashes) cannot substantiate a local anchor.
  if (!hits.some((hit) => {
    if (hit.corpusVersion && hit.corpusVersion !== corpus.manifest.corpusVersion) return false;
    const fragment = corpus.fragments.get(hit.logicalId);
    return usable(fragment) && fragment.fragmentSha256 === hit.fragmentSha256;
  })) return { vectorIds: [], items: [] };

  const keys = new Set(options.locatorKeys ?? []);
  if (keys.size) {
    for (const f of corpus.fragments.values()) {
      if (f.locatorKeys.some((k) => keys.has(k))) add(f, "locator", null);
    }
  }

  const vectorIds: string[] = [];
  for (const hit of hits.slice(0, TOP_K)) {
    if (hit.corpusVersion && hit.corpusVersion !== corpus.manifest.corpusVersion) continue;
    const f = corpus.fragments.get(hit.logicalId);
    if (!usable(f) || f.fragmentSha256 !== hit.fragmentSha256) continue;
    vectorIds.push(f.logicalId);
  }
  for (const id of vectorIds) {
    const f = corpus.fragments.get(id)!;
    const score = hits.find((h) => h.logicalId === id)?.score ?? null;
    add(f, "vector", score);
    for (const p of f.primaryIds) add(corpus.fragments.get(p), "primary", null);
    for (const r of f.relatedIds) add(corpus.fragments.get(r), "related", null);
  }

  const present = new Set(items.map((i) => i.fragment.logicalId));
  const deduped = items.filter(
    (i) => isPrimary(corpus, i.fragment) || i.fragment.primaryIds.length === 0 || !i.fragment.primaryIds.every((p) => present.has(p)),
  );
  return { vectorIds, items: deduped.slice(0, MAX_EVIDENCE) };
}
