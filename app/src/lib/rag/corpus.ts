import { createHash } from "node:crypto";
import { z } from "zod";

/**
 * Public legal corpus: manifest + hand-checked fragments (JSONL).
 * Pure functions only; reading files lives in corpus-fs.ts.
 */

/** Hosts we accept as official sources. Anything else fails validation. */
export const OFFICIAL_HOSTS = ["eli.gov.pl", "dziennikustaw.gov.pl", "isap.sejm.gov.pl", "www.gov.pl", "www.zus.pl"];

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const officialUrl = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" && OFFICIAL_HOSTS.includes(url.host);
  }, "non-official URL");

export const authoritySchema = z.enum(["statute", "regulation", "ministry_guidance", "zus_guidance"]);
export type Authority = z.infer<typeof authoritySchema>;
export const PRIMARY_AUTHORITIES: Authority[] = ["statute", "regulation"];

export const documentSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  shortTitle: z.string().min(1),
  authority: authoritySchema,
  issuer: z.string().min(1),
  sourceType: z.enum(["pdf", "html"]),
  url: officialUrl,
  landingUrl: officialUrl,
  retrievedAt: isoDate,
  sourceSha256: z.string().regex(/^[0-9a-f]{64}$/),
  /** Unknown validity stays null; never filled with the retrieval date. */
  validFrom: isoDate.nullable(),
  validTo: isoDate.nullable(),
  versionNote: z.string().min(1),
});
export type CorpusDocument = z.infer<typeof documentSchema>;

export const manifestSchema = z.object({
  corpusVersion: z.string().regex(/^[a-z0-9-]+$/),
  locale: z.literal("pl"),
  description: z.string(),
  verifiedAt: isoDate,
  fragmentsFile: z.string().min(1),
  expectedFragments: z.number().int().positive(),
  documents: z.array(documentSchema).min(1),
});
export type Manifest = z.infer<typeof manifestSchema>;

export const fragmentSchema = z.object({
  logicalId: z.string().regex(/^[a-z0-9-]+$/),
  corpusVersion: z.string(),
  documentId: z.string(),
  locator: z.string().min(1),
  /** Normalised article/paragraph keys for exact lookups, e.g. "art182^1d§1". */
  locatorKeys: z.array(z.string()),
  page: z.number().int().positive().nullable(),
  headingPath: z.array(z.string()),
  topic: z.string().min(1),
  locale: z.literal("pl"),
  context: z.string(),
  sourceText: z.string().min(1),
  /** Distant exceptions or context that must travel with this unit. */
  relatedIds: z.array(z.string()),
  /** For guidance: the primary-law units it restates. */
  primaryIds: z.array(z.string()),
  fragmentSha256: z.string().regex(/^[0-9a-f]{64}$/),
});
export type Fragment = z.infer<typeof fragmentSchema>;

export interface Corpus {
  manifest: Manifest;
  documents: Map<string, CorpusDocument>;
  fragments: Map<string, Fragment>;
}

/** Same whitespace normalisation for hashes and for quote checks. */
export function normalizeSpaces(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export function fragmentHash(sourceText: string): string {
  return sha256(normalizeSpaces(sourceText));
}

/** Deterministic UUID (v5 layout) from version + logicalId: re-import gives the same ids. */
export function pointId(corpusVersion: string, logicalId: string): string {
  const bytes = createHash("sha1").update(`zusik-corpus:${corpusVersion}:${logicalId}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function isPrimary(corpus: Corpus, fragment: Fragment): boolean {
  const doc = corpus.documents.get(fragment.documentId);
  return !!doc && PRIMARY_AUTHORITIES.includes(doc.authority);
}

/** Text sent for embedding: title + locator + context + fragment. */
export function embeddingText(corpus: Corpus, fragment: Fragment): string {
  const doc = corpus.documents.get(fragment.documentId);
  return [doc?.shortTitle, fragment.locator, fragment.context, fragment.sourceText].filter(Boolean).join("\n");
}

/** Link the parent opens: PDF jumps to the page, HTML opens the page (no verified anchors yet). */
export function citationUrl(corpus: Corpus, fragment: Fragment): string {
  const doc = corpus.documents.get(fragment.documentId);
  if (!doc) return "";
  return doc.sourceType === "pdf" && fragment.page ? `${doc.url}#page=${fragment.page}` : doc.url;
}

/** Validity window for a case date: the document's known window, if any. */
export function isValidOn(corpus: Corpus, fragment: Fragment, isoDay: string): boolean {
  const doc = corpus.documents.get(fragment.documentId);
  if (!doc) return false;
  if (doc.validFrom && isoDay < doc.validFrom) return false;
  if (doc.validTo && isoDay > doc.validTo) return false;
  return true;
}

export class CorpusValidationError extends Error {
  constructor(public readonly problems: string[]) {
    super(`Corpus invalid:\n- ${problems.join("\n- ")}`);
    this.name = "CorpusValidationError";
  }
}

/** Parses and validates the whole corpus. Throws with every problem found. */
export function buildCorpus(manifestJson: unknown, fragmentsJsonl: string): Corpus {
  const problems: string[] = [];
  const parsedManifest = manifestSchema.safeParse(manifestJson);
  if (!parsedManifest.success) {
    throw new CorpusValidationError(parsedManifest.error.issues.map((i) => `manifest ${i.path.join(".")}: ${i.message}`));
  }
  const manifest = parsedManifest.data;
  const documents = new Map<string, CorpusDocument>();
  for (const doc of manifest.documents) {
    if (documents.has(doc.id)) problems.push(`duplicate document id ${doc.id}`);
    documents.set(doc.id, doc);
  }

  const fragments = new Map<string, Fragment>();
  fragmentsJsonl
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line, index) => {
      let raw: unknown;
      try {
        raw = JSON.parse(line);
      } catch {
        problems.push(`line ${index + 1}: invalid JSON`);
        return;
      }
      const parsed = fragmentSchema.safeParse(raw);
      if (!parsed.success) {
        problems.push(`line ${index + 1}: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
        return;
      }
      const f = parsed.data;
      if (fragments.has(f.logicalId)) problems.push(`duplicate logicalId ${f.logicalId}`);
      if (f.corpusVersion !== manifest.corpusVersion) problems.push(`${f.logicalId}: corpusVersion ${f.corpusVersion}`);
      const doc = documents.get(f.documentId);
      if (!doc) problems.push(`${f.logicalId}: unknown document ${f.documentId}`);
      if (doc?.sourceType === "pdf" && !f.page) problems.push(`${f.logicalId}: PDF fragment without page`);
      if (doc?.sourceType === "html" && f.headingPath.length === 0) problems.push(`${f.logicalId}: HTML fragment without headingPath`);
      if (fragmentHash(f.sourceText) !== f.fragmentSha256) problems.push(`${f.logicalId}: fragmentSha256 mismatch`);
      fragments.set(f.logicalId, f);
    });

  for (const f of fragments.values()) {
    for (const id of [...f.relatedIds, ...f.primaryIds]) {
      if (!fragments.has(id)) problems.push(`${f.logicalId}: broken link to ${id}`);
      if (id === f.logicalId) problems.push(`${f.logicalId}: links to itself`);
    }
    for (const id of f.primaryIds) {
      const target = fragments.get(id);
      const doc = target && documents.get(target.documentId);
      if (doc && !PRIMARY_AUTHORITIES.includes(doc.authority)) problems.push(`${f.logicalId}: primaryId ${id} is not primary law`);
    }
  }
  if (fragments.size !== manifest.expectedFragments) {
    problems.push(`expected ${manifest.expectedFragments} fragments, found ${fragments.size}`);
  }
  if (problems.length) throw new CorpusValidationError(problems);
  return { manifest, documents, fragments };
}

/** Hash of the whole version: ids + fragment hashes, order-independent. */
export function corpusDigest(corpus: Corpus): string {
  const lines = [...corpus.fragments.values()].map((f) => `${f.logicalId}:${f.fragmentSha256}`).sort();
  return sha256(lines.join("\n"));
}

/** Test helper and ablation: a copy of the corpus without some units (links to them are dropped). */
export function withoutFragments(corpus: Corpus, removed: string[]): Corpus {
  const gone = new Set(removed);
  const fragments = new Map<string, Fragment>();
  for (const [id, f] of corpus.fragments) {
    if (gone.has(id)) continue;
    fragments.set(id, {
      ...f,
      relatedIds: f.relatedIds.filter((x) => !gone.has(x)),
      primaryIds: f.primaryIds.filter((x) => !gone.has(x)),
    });
  }
  return { ...corpus, fragments };
}
