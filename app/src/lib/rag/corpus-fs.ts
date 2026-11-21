import { readFileSync } from "node:fs";
import path from "node:path";
import { buildCorpus, type Corpus } from "./corpus";

/**
 * Loads app/corpus/<name>/ from disk. The route bundles these files via
 * outputFileTracingIncludes in next.config.ts; cwd is app/ locally and on Vercel.
 */
const cache = new Map<string, Corpus>();

export function corpusDir(name: string, root = process.cwd()): string {
  return path.join(root, "corpus", name);
}

export function loadCorpus(name = "marta", root?: string): Corpus {
  const dir = corpusDir(name, root);
  const cached = cache.get(dir);
  if (cached) return cached;
  const manifest = JSON.parse(readFileSync(path.join(dir, "manifest.json"), "utf8"));
  const fragments = readFileSync(path.join(dir, manifest.fragmentsFile ?? "fragments.jsonl"), "utf8");
  const corpus = buildCorpus(manifest, fragments);
  cache.set(dir, corpus);
  return corpus;
}
