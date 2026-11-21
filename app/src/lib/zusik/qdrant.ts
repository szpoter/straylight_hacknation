import { DEFAULT_EMBED_MODEL, QDRANT_TIMEOUT_MS } from "./config";
import type { RetrievalResult } from "./types";

export interface QdrantSettings {
  url: string;
  apiKey: string;
  collection: string;
  model?: string;
  fetchImpl?: typeof fetch;
}

interface QueryResponse {
  result?: { points?: Array<{ id: number | string; score: number; payload?: Record<string, unknown> }> };
}

/**
 * Pure vector query: Qdrant Cloud Inference embeds the text with the same
 * model used at import. No filter by expected id.
 */
export async function queryQdrant(settings: QdrantSettings, text: string, limit = 1): Promise<RetrievalResult> {
  const started = Date.now();
  const doFetch = settings.fetchImpl ?? fetch;
  try {
    const res = await doFetch(
      `${settings.url.replace(/\/$/, "")}/collections/${encodeURIComponent(settings.collection)}/points/query`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "api-key": settings.apiKey },
        body: JSON.stringify({
          query: { text, model: settings.model ?? DEFAULT_EMBED_MODEL },
          filter: { must: [{ is_empty: { key: "corpusVersion" } }] },
          limit,
          with_payload: true,
        }),
        signal: AbortSignal.timeout(QDRANT_TIMEOUT_MS),
        cache: "no-store",
      },
    );
    if (!res.ok) {
      console.error(JSON.stringify({ event: "qdrant_error", status: res.status }));
      return { status: "error", fragment: null, ms: Date.now() - started };
    }
    const body = (await res.json()) as QueryResponse;
    const top = body.result?.points?.[0];
    const sourceId = top?.payload?.sourceId;
    const fragmentText = top?.payload?.text;
    if (!top || typeof sourceId !== "string" || typeof fragmentText !== "string") {
      return { status: "no_hit", fragment: null, ms: Date.now() - started };
    }
    return { status: "ok", fragment: { sourceId, text: fragmentText, score: top.score }, ms: Date.now() - started };
  } catch (error) {
    console.error(JSON.stringify({ event: "qdrant_error", error: (error as Error).name }));
    return { status: "error", fragment: null, ms: Date.now() - started };
  }
}
