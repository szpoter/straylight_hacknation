import { randomUUID } from "node:crypto";
import { readFile, writeFile, rename } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { parse } from "next/dist/compiled/node-html-parser/index.js";
import { normalizeSpaces, sha256 } from "../src/lib/rag/corpus";
import { FAMILY_CATALOG_URL, familyProgramUrl } from "../src/lib/rag/official-sections";

const output = "corpus/source-review.json";
type Page = { url: string; title: string; hash: string };
type Change = { kind: "new" | "changed" | "withdrawn"; url: string; title: string; before: string | null; after: string | null };
type Review = { pages: Page[]; changes: Change[] };

export function compareSources(previous: Page[], current: Page[]): Change[] {
  const before = new Map(previous.map(p => [p.url, p]));
  const after = new Map(current.map(p => [p.url, p]));
  const changes: Change[] = [];
  for (const url of [...new Set([...before.keys(), ...after.keys()])].sort()) {
    const old = before.get(url), next = after.get(url);
    if (old?.hash === next?.hash) continue;
    changes.push({ url, title: next?.title ?? old?.title ?? url, before: old?.hash ?? null, after: next?.hash ?? null,
      kind: !old ? "new" : !next ? "withdrawn" : "changed" });
  }
  return changes;
}

async function article(url: string) {
  const response = await fetch(url, { redirect: "error", credentials: "omit", signal: AbortSignal.timeout(12_000) });
  if (!response.ok || !response.headers.get("content-type")?.startsWith("text/html")) throw new Error("Nie odczytano strony " + url);
  const document = parse(await response.text());
  const body = document.querySelectorAll(".article__main .zus-cms");
  const title = document.querySelectorAll("h1")[0]?.text;
  if (body.length !== 1 || !title || !body[0].text.trim()) throw new Error("Brak jednoznacznej treści " + url);
  return { body: body[0], title: normalizeSpaces(title) };
}

async function run() {
  const previous: Review = JSON.parse(await readFile(output, "utf8"));
  const index = await article(FAMILY_CATALOG_URL);
  const urls = new Set<string>();
  for (const a of index.body.querySelectorAll("a[href]")) {
    const url = familyProgramUrl(a.getAttribute("href") ?? "");
    if (url) urls.add(url);
  }
  if (!urls.size || urls.size > 80) throw new Error("Nierozpoznany katalog. Zachowano poprzedni odczyt.");
  const pages: Page[] = [];
  for (const url of [...urls].sort()) {
    const { body, title } = await article(url);
    pages.push({ url, title, hash: sha256(normalizeSpaces(body.text)) });
  }
  const changes = compareSources(previous.pages, pages);
  if (!changes.length) { console.log("Brak zmian w treści urzędowych publikacji."); return; }
  const pending = new Map(previous.changes.map(c => [c.url, c]));
  for (const change of changes) pending.set(change.url, change);
  const temp = output + "." + randomUUID();
  await writeFile(temp, JSON.stringify({ pages, changes: [...pending.values()] }, null, 2) + "\n", { flag: "wx" });
  await rename(temp, output);
  console.log(changes.map(c => c.kind + " " + c.url).join("\n"));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch(error => { console.error(error.message); process.exitCode = 1; });
}
