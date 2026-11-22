import type { AskCitation } from "../zusik/types";
import { fragmentHash } from "./corpus";
import { extractOfficialParagraph, FAMILY_CATALOG_URL, familyProgramUrl, getOfficialSection, matchingProgramLinks, matchingProgramSection } from "./official-sections";

type Facet = Parameters<typeof getOfficialSection>[1];
type Snapshot = { url: string; html: string; retrievedAt: string; etag: string | null; modified: string | null };
const byteLimit = 2 * 1024 * 1024;

export async function readLimitedBody(response: Response, limit: number) {
  if (Number(response.headers.get("content-length")) > limit || !response.body) {
    await response.body?.cancel();
    throw new Error("Unsupported official document");
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return Buffer.concat(chunks);
      size += value.byteLength;
      if (size > limit) throw new Error("Official document exceeds limit");
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
}

async function readHtml(response: Response) {
  if (!/^text\/html(?:\s*;|$)/i.test(response.headers.get("content-type") ?? "")) {
    await response.body?.cancel();
    throw new Error("Unsupported official document");
  }
  return (await readLimitedBody(response, byteLimit)).toString("utf8");
}

type FetchResult = { citation: AskCitation | null; fetches: number; unavailable: boolean };
type Step = { fetches: number; deadline: number };

function officialPublications(request: typeof fetch) {
  const cache = new Map<string, Snapshot>();
  const pending = new Map<string, Promise<Snapshot>>();
  const retryAfter = new Map<string, number>();

  async function download(url: string, step: Step, old?: Snapshot): Promise<Snapshot> {
    let next = url;
    for (let forwards = 0; forwards <= 2; forwards++) {
      if (next !== FAMILY_CATALOG_URL && familyProgramUrl(next) !== next) throw new Error("Unapproved source");
      if ((retryAfter.get(next) ?? 0) > Date.now()) throw new Error("Official host rate limited");
      const budget = Math.min(3_500, step.deadline - Date.now());
      if (budget <= 0) throw new Error("Official lookup deadline");
      const headers: Record<string, string> = { accept: "text/html" };
      if (next === old?.url && old.etag) headers["if-none-match"] = old.etag;
      if (next === old?.url && old.modified) headers["if-modified-since"] = old.modified;
      step.fetches++;
      const response = await request(next, { headers, credentials: "omit", redirect: "manual",
        cache: "no-store", signal: AbortSignal.timeout(budget) });
      const retrievedAt = new Date().toISOString();
      if (response.status === 304 && old && next === old.url) return { ...old, retrievedAt };
      if ([301,302,303,307,308].includes(response.status)) {
        await response.body?.cancel();
        const location = response.headers.get("location");
        const allowed = location && familyProgramUrl(location, next);
        if (!allowed) throw new Error("Unapproved redirected source");
        next = allowed;
        continue;
      }
      if (!response.ok) {
        if (response.status === 429) {
          const value = response.headers.get("retry-after") ?? "60";
          const time = /^\d+$/.test(value) ? Date.now() + Number(value) * 1000 : Date.parse(value);
          retryAfter.set(next, Number.isFinite(time) ? time : Date.now() + 60_000);
        }
        await response.body?.cancel();
        throw new Error("Official page unavailable");
      }
      return { url: next, html: await readHtml(response), retrievedAt, etag: response.headers.get("etag"),
        modified: response.headers.get("last-modified") };
    }
    throw new Error("Too many redirects");
  }

  function load(url: string, step: Step) {
    const remaining = step.deadline - Date.now();
    if (remaining <= 0) return Promise.reject(new Error("Official lookup deadline"));
    const snapshot = cache.get(url);
    if (snapshot && Date.now() - Date.parse(snapshot.retrievedAt) < 3_600_000) return Promise.resolve(snapshot);
    let flight = pending.get(url);
    if (!flight) {
      flight = download(url, step, snapshot).then(result => {
        if (cache.size >= 30) cache.delete(cache.keys().next().value ?? "");
        cache.set(url, result);
        return result;
      }).finally(() => pending.delete(url));
      pending.set(url, flight);
    }
    const active = flight;
    return new Promise<Snapshot>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Official lookup deadline")), remaining);
      active.then(resolve, reject).finally(() => clearTimeout(timeout));
    });
  }
  function citation(sourceId: string, fragment: string, page: Snapshot, title: string, heading: string, quote: string): AskCitation {
    const hash = fragmentHash(quote);
    return { id: "c1", sourceId, fragmentId: "live-" + fragment + "-" + hash.slice(0, 16),
      title, locator: heading, url: page.url, headingPath: [title, heading], page: null, quote, hash,
      authority: "zus_guidance", origin: "official_live", retrievedAt: page.retrievedAt, corpusVersion: "www-" + hash };
  }
  return {
    async readSection(sourceId: string, facet: Facet, deadlineMs?: number): Promise<FetchResult> {
      const step = { fetches: 0, deadline: Math.min(deadlineMs ?? Infinity, Date.now() + 8_000) };
      const section = getOfficialSection(sourceId, facet);
      try {
        if (section) {
          const page = await load(section.url, step);
          const sameArticle = new URL(page.url).pathname.replace(/^\/pl\//, "/") === new URL(section.url).pathname.replace(/^\/pl\//, "/");
          const quote = sameArticle && extractOfficialParagraph(page.html, section.heading, section.paragraphStarts);
          if (quote) return { citation: citation(sourceId, section.fragmentId, page, section.title, section.heading, quote), fetches: step.fetches, unavailable: false };
        }
        return { citation: null, fetches: step.fetches, unavailable: false };
      } catch { return { citation: null, fetches: step.fetches, unavailable: true }; }
    },
    async discover(question: string, asOf: string, deadlineMs?: number): Promise<FetchResult> {
      const step = { fetches: 0, deadline: Math.min(deadlineMs ?? Infinity, Date.now() + 8_000) };
      try {
        if (asOf !== new Date().toISOString().slice(0, 10)) return { citation: null, fetches: 0, unavailable: false };
        const index = await load(FAMILY_CATALOG_URL, step);
        const links = matchingProgramLinks(index.html, question);
        if (links.length && links.length <= 2) {
          const hits: AskCitation[] = [];
          for (const link of links) {
            const page = await load(link, step);
            const section = matchingProgramSection(page.html, question);
            if (section) {
              const id = "zus-" + fragmentHash(page.url).slice(0, 16);
              hits.push(citation(id, id, page, section.title, section.heading, section.quote));
            }
          }
          if (hits.length === 1) return { citation: hits[0], fetches: step.fetches, unavailable: false };
        }
        return { citation: null, fetches: step.fetches, unavailable: false };
      } catch { return { citation: null, fetches: step.fetches, unavailable: true }; }
    },
  };
}

export function officialEvidenceReader(request: typeof fetch = fetch) { return officialPublications(request).readSection; }
export function officialCatalogueReader(request: typeof fetch = fetch) { return officialPublications(request).discover; }
const publications = officialPublications(fetch);
export const fetchOfficialEvidence = publications.readSection;
export const discoverOfficialEvidence = publications.discover;
