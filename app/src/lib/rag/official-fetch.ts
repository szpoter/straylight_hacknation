import type { AskCitation } from "../zusik/types";
import { fragmentHash } from "./corpus";
import { extractOfficialParagraph, getOfficialSection } from "./official-sections";

type Facet = Parameters<typeof getOfficialSection>[1];
type Snapshot = { html: string; retrievedAt: string; etag: string | null; modified: string | null };
const byteLimit = 2 * 1024 * 1024;

async function readHtml(response: Response) {
  if (!/^text\/html(?:\s*;|$)/i.test(response.headers.get("content-type") ?? "") ||
      Number(response.headers.get("content-length")) > byteLimit || !response.body) {
    await response.body?.cancel();
    throw new Error("Unsupported official document");
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return Buffer.concat(chunks).toString("utf8");
      size += value.byteLength;
      if (size > byteLimit) throw new Error("Official document exceeds limit");
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
}

export function officialEvidenceReader(request: typeof fetch = fetch) {
  const cache = new Map<string, Snapshot>();
  const pending = new Map<string, Promise<Snapshot>>();
  const retryAfter = new Map<string, number>();
  return async (sourceId: string, facet: Facet) => {
    let fetches = 0;
    const section = getOfficialSection(sourceId, facet);
    if (!section) return { citation: null, fetches, unavailable: false };
    const { url, heading, title } = section;
    const approved = new URL(url);
    if (approved.origin !== "https://www.zus.pl" || approved.username || approved.password ||
        approved.search || approved.hash || !approved.pathname.startsWith("/aktywnyrodzic/"))
      return { citation: null, fetches, unavailable: false };
    let snapshot = cache.get(url);
    try {
      if (!snapshot || Date.now() - Date.parse(snapshot.retrievedAt) >= 3_600_000) {
        if ((retryAfter.get(url) ?? 0) > Date.now()) throw new Error("Official host rate limited");
        let flight = pending.get(url);
        if (!flight) {
          fetches++;
          const old = snapshot;
          flight = (async (): Promise<Snapshot> => {
            const headers: Record<string, string> = { accept: "text/html" };
            if (old?.etag) headers["if-none-match"] = old.etag;
            if (old?.modified) headers["if-modified-since"] = old.modified;
            // The registry contains final canonical URLs. A changed address needs review.
            const response = await request(url, { headers, credentials: "omit", redirect: "error",
              cache: "no-store", signal: AbortSignal.timeout(8_000) });
            const retrievedAt = new Date().toISOString();
            if (old && response.status === 304) return { ...old, retrievedAt };
            if (!response.ok) {
              if (response.status === 429) {
                const value = response.headers.get("retry-after") ?? "60";
                const next = /^\d+$/.test(value) ? Date.now() + Number(value) * 1000 : Date.parse(value);
                retryAfter.set(url, Number.isFinite(next) ? next : Date.now() + 60_000);
              }
              await response.body?.cancel();
              throw new Error("Official page unavailable");
            }
            return { html: await readHtml(response), retrievedAt, etag: response.headers.get("etag"),
              modified: response.headers.get("last-modified") };
          })().then(result => { cache.set(url, result); return result; }).finally(() => pending.delete(url));
          pending.set(url, flight);
        }
        snapshot = await flight;
      }
      const quote = extractOfficialParagraph(snapshot.html, heading);
      if (!quote) return { citation: null, fetches, unavailable: false };
      const hash = fragmentHash(quote);
      const citation: AskCitation = {
        id: "c1", sourceId, fragmentId: "live-" + section.fragmentId + "-" + hash.slice(0, 16),
        title, locator: heading, url, headingPath: [title, heading], page: null, quote, hash,
        authority: "zus_guidance", origin: "official_live", retrievedAt: snapshot.retrievedAt,
        corpusVersion: "www-" + hash,
      };
      return { citation, fetches, unavailable: false };
    } catch {
      return { citation: null, fetches, unavailable: true };
    }
  };
}

export const fetchOfficialEvidence = officialEvidenceReader();
