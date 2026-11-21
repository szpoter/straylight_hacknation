import { DEFAULT_EMBED_MODEL } from "../zusik/config";
import { isPrimary, isValidOn, type Corpus, type Fragment } from "./corpus";

/** Cloud Inference embeds the query; the first call after idle can take several seconds. */
export const KNOWLEDGE_TIMEOUT_MS = 10_000;

/** One vector hit as returned by Qdrant, before joining with the local corpus. */
export interface VectorHit {
  logicalId: string;
  fragmentSha256: string;
  score: number;
}

export interface VectorSearchResult {
  status: "ok" | "error";
  hits: VectorHit[];
  ms: number;
}

/** External search. Injected so tests and the eval can control it. */
export interface KnowledgeSearch {
  search(input: { query: string; expanded: string | null; corpusVersion: string; limit: number }): Promise<VectorSearchResult>;
}

export interface KnowledgeSettings {
  url: string;
  apiKey: string;
  collection: string;
  model?: string;
  fetchImpl?: typeof fetch;
}

interface QueryResponse {
  result?: { points?: Array<{ id: string | number; score: number; payload?: Record<string, unknown> }> };
}

/**
 * Qdrant Cloud Inference search filtered to one corpus version.
 * With an expanded query, both texts are prefetched and fused with RRF.
 */
export function qdrantKnowledgeSearch(settings: KnowledgeSettings): KnowledgeSearch {
  const doFetch = settings.fetchImpl ?? fetch;
  const model = settings.model ?? DEFAULT_EMBED_MODEL;
  return {
    async search({ query, expanded, corpusVersion, limit }) {
      const started = Date.now();
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
        const res = await doFetch(
          `${settings.url.replace(/\/$/, "")}/collections/${encodeURIComponent(settings.collection)}/points/query`,
          {
            method: "POST",
            headers: { "content-type": "application/json", "api-key": settings.apiKey },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(KNOWLEDGE_TIMEOUT_MS),
            cache: "no-store",
          },
        );
        if (!res.ok) {
          console.error(JSON.stringify({ event: "knowledge_qdrant_error", status: res.status }));
          return { status: "error", hits: [], ms: Date.now() - started };
        }
        const points = ((await res.json()) as QueryResponse).result?.points ?? [];
        const hits = points.flatMap((p) => {
          const logicalId = p.payload?.logicalId;
          const hash = p.payload?.fragmentSha256;
          return typeof logicalId === "string" && typeof hash === "string"
            ? [{ logicalId, fragmentSha256: hash, score: p.score }]
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
    const f = corpus.fragments.get(hit.logicalId);
    if (!f || f.fragmentSha256 !== hit.fragmentSha256) continue;
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
