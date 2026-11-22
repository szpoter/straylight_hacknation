// Run on the private QA station. The allowlist contains only development case hashes.
// Reports fixed counters, never text, document IDs, labels from a page or names.
import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { analyzeCasePage, type LocalCasePage } from "../src/features/chat/case-evidence";

const app = fileURLToPath(new URL("../", import.meta.url));
const dir = path.join(homedir(), "Library/Application Support/Zusik/private-cases");
const safe = (file: string) => {
  const info = lstatSync(file);
  if (info.isSymbolicLink() || info.uid !== process.getuid?.() || (info.mode & 0o077)) throw new Error("private_access");
  return file;
};
const signals = {
  birthLabel: /data(?: i miejsce)? urodzenia/u,
  formRequest: /(?:wnosze|wnioskuje|zwracam sie|prosze|wniosek o).{0,170}(?:zasil(?:ek|ku) macierzynski|urlopu? (?:macierzynski|ojcowski|rodzicielski))/u,
  insuranceStatement: /(?:nie )?podlega\w*.{0,70}ubezpieczen/u,
  payrollMonth: /\bmiesiac\b|m-c/u,
  payrollGross: /wynagrodzenie brutto/u,
  payrollPercent: /procent.{0,25}sklad/u,
};
function run() {
  safe(dir);
  const workDir = safe(path.resolve(dir, "../qa-work"));
  const ids: unknown = JSON.parse(readFileSync(safe(path.join(workDir, "digests.json")), "utf8"));
  if (!Array.isArray(ids) || !ids.length || !ids.every(s => typeof s === "string" && /^[a-f\d]{64}$/u.test(s)) || ids.length > 60) throw new Error("work_allowlist");
  const index = new DatabaseSync(safe(path.join(dir, "index.sqlite3")), { readOnly: true });
  const get = index.prepare("SELECT number,method,text FROM pages WHERE sha = ? ORDER BY number");
  const counts: Record<string, number> = {};
  const bump = (k: string) => { counts[k] = (counts[k] ?? 0) + 1; };
  for (const digest of ids) {
    let previous: LocalCasePage | undefined;
    let found = false;
    for (const result of get.iterate(digest)) {
      if (typeof result.text !== "string" || typeof result.number !== "number") throw new Error("index_schema");
      const text = result.text.normalize("NFD").replace(/\p{M}/gu, "").replace(/ł/giu, "l").toLowerCase();
      const dense = text.replace(/\s+/gu, " ");
      for (const [key, pattern] of Object.entries(signals)) if (pattern.test(dense)) bump("layout." + key);
      const page = analyzeCasePage("local", result.number, result.text, result.method === "pdf" ? "pdf_text" : "ocr", previous);
      previous = page;
      bump("pages.total"); bump("method." + (["pdf", "ocr", "blank", "short", "unreadable"].includes(String(result.method)) ? result.method : "unknown")); bump("role." + page.role); bump("status." + page.status);
      if (page.leaveRequests?.length) bump("pages.leaveRequest");
      if (page.reason) bump("reason." + page.reason);
      for (const candidate of page.candidates) { bump("candidate." + candidate.field); found = true; }
    }
    bump("documents.total");
    if (found) bump("documents.withCandidates");
  }
  index.close();
  const hash = createHash("sha256");
  for (const f of ["case-claim-fields.ts", "case-written-request.ts", "case-evidence.ts", "read-case-pdf.ts", "case-page-layout.ts"]) hash.update(readFileSync(path.join(app, "src/features/chat", f)));
  console.log(JSON.stringify({ index: "local-pdfkit-vision", sourceFingerprint: hash.digest("hex"), counts }));
}
try { run(); } catch { console.error("aggregate_diagnostic_unavailable"); process.exitCode = 1; }
