/** Run from app/: node --env-file=.env.local --import tsx scripts/zusik-eval-public.ts */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateAnswer, locateQuote } from "../src/lib/rag/answer";
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import { publicQuestion, type PublicQuestion } from "../src/lib/rag/public-query";
import { qdrantKnowledgeSearch } from "../src/lib/rag/retrieve";
import { answerQuestion } from "../src/lib/zusik/ask-service";
import { requireEnv } from "../src/lib/zusik/config";

interface Example {
  id: string;
  question: string;
  pack: PublicQuestion["corpus"] | null;
  expected: string[];
  word: string;
  generate: boolean;
}

async function main() {
  const target = join(process.cwd(), "corpus/publiczne");
  const examples = JSON.parse(readFileSync(join(target, "eval.json"), "utf8")) as Example[];
  const dedicated = Boolean(process.env.QDRANT_KNOWLEDGE_COLLECTION && process.env.QDRANT_KNOWLEDGE_READ_KEY);
  const collection = requireEnv(dedicated ? "QDRANT_KNOWLEDGE_COLLECTION" : "QDRANT_COLLECTION");
  const search = qdrantKnowledgeSearch({
    url: requireEnv("QDRANT_URL"), collection,
    apiKey: requireEnv(dedicated ? "QDRANT_KNOWLEDGE_READ_KEY" : "QDRANT_READ_KEY"),
    model: process.env.QDRANT_EMBED_MODEL,
  });
  const rows = [];
  for (const example of examples) {
    const plan = publicQuestion(example.question);
    const corpus = loadCorpus(plan?.corpus ?? "marta");
    const result = await answerQuestion({
      corpus, search, selectCorpus: loadCorpus,
      generate: async (q, evidence, activeCorpus) => example.generate
        ? generateAnswer({ baseURL: requireEnv("SHERLOCK_BASE_URL"), apiKey: requireEnv("SHERLOCK_API_KEY"), model: requireEnv("SHERLOCK_MODEL") }, activeCorpus, q, evidence)
        : { status: "ok", output: { status: "insufficient_evidence", message: "", claims: [] }, model: "retrieval-only", ms: 0 },
    }, example.question);
    const { answer, trace } = result;
    const rawHit = example.expected.some((id) => trace.vectorIds.includes(id));
    const evidenceHit = example.expected.some((id) => trace.evidenceIds.includes(id));
    const cited = answer.citations.map((citation) => citation.fragmentId);
    const verified = answer.citations.every((citation) => {
      const fragment = corpus.fragments.get(citation.fragmentId);
      return fragment && locateQuote(fragment.sourceText, citation.quote);
    });
    const pass = example.pack === null
      ? !plan && answer.status === "insufficient_evidence" && trace.calls.qdrant === 0 && trace.calls.sherlock === 0
      : plan?.corpus === example.pack && evidenceHit && (!example.generate || (verified && answer.status === "answered"
        && cited.some((id) => example.expected.includes(id))
        && answer.claims.every((c) => c.citationIds.length > 0)
        && new RegExp(example.word, "iu").test(answer.claims.map((c) => c.text).join(" "))));
    rows.push({
      id: example.id, mode: example.generate ? "retrieval+model" : example.pack ? "retrieval" : "abstention",
      pass, rawHit, evidenceHit, version: answer.corpusVersion, status: !example.pack || example.generate ? answer.status : "not_measured",
      top5: trace.vectorIds, evidence: trace.evidenceIds, citations: example.generate ? answer.citations : [],
      claims: example.generate ? answer.claims : [], message: example.generate ? answer.message : undefined,
      modelProposedStatus: example.generate ? trace.proposedStatus : undefined, quoteReason: example.generate ? trace.quoteReason : undefined,
      model: example.generate ? trace.model : undefined, modelMs: example.generate ? trace.modelMs : undefined,
    });
    console.log(example.id, pass ? "PASS" : "FAIL", "vector", rawHit, "evidence", evidenceHit, answer.status, cited.join(","));
  }
  const passed = rows.filter((r) => r.pass).length;
  writeFileSync(join(target, "eval-report.json"), JSON.stringify({ evaluatedAt: new Date().toISOString(), collection, passed, total: rows.length, rows }, null, 2) + "\n");
  if (passed !== rows.length) process.exitCode = 1;
}

main().catch((error: Error) => { console.error(error.message); process.exitCode = 1; });
