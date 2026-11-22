// From app/: node --import tsx scripts/zusik-eval-model-evidence.mjs hosted-bielik|pllum
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { buildPrompt, parseModelAnswer, SYSTEM_PROMPT, validateAnswer } from "../src/lib/rag/answer.ts";
import { loadCorpus } from "../src/lib/rag/corpus-fs.ts";
import { localModelIds, taskSpecs } from "../src/lib/rag/model-tasks.ts";
import { ragAssertions } from "./zusik-eval-g7.ts";

const provider = process.argv[2];
assert(["hosted-bielik", "pllum"].includes(provider), "Choose hosted-bielik or pllum");
const source = readFileSync("tests/fixtures/zusik-acceptance/g7.jsonl", "utf8");
assert.equal(createHash("sha256").update(source).digest("hex"), "51ca95e212e91b7541369e327e70d467ed14ab6e02e590f2cadc9387e6b63781");
const trials = source.trim().split("\n").map(line => JSON.parse(line));
const packs = ["marta", "publiczne", "oferta"].map(name => loadCorpus(name));
const ids = ["detention", "crime", "incidental-work", "wait", "rehab-rates", "paternity-length", "parts", "family-year"];
const examples = ids.map(id => {
  const trial = trials.find(t => t.id === id);
  const pack = packs.find(p => trial.requiredEvidence.every(ref => p.fragments.has(ref)));
  return { id, trial, pack, fragments: trial.requiredEvidence.map(ref => pack.fragments.get(ref)) };
});
for (const [question, evidence] of [[0, 3], [7, 5]]) {
  examples.push({ ...examples[evidence], trial: examples[question].trial, id: examples[question].id + "-absent", absent: true });
}

const { timeout, tokens } = taskSpecs.answer_evidence;
async function generate(prompt) {
  const signal = AbortSignal.timeout(timeout);
  const messages = [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: prompt }];
  const hosted = provider === "hosted-bielik";
  const model = hosted ? "arklabsai/Bielik-11B-v3.1-Instruct" : localModelIds.pllum;
  const url = hosted ? new URL(process.env.SHERLOCK_BASE_URL.replace(/\/$/, "") + "/chat/completions") : new URL("http://127.0.0.1:11479/api/chat");
  if (hosted) assert(url.protocol === "https:" && process.env.SHERLOCK_API_KEY);
  const response = await fetch(url, {
    method: "POST", redirect: "error", signal,
    headers: { "Content-Type": "application/json", ...(hosted ? { authorization: "Bearer " + process.env.SHERLOCK_API_KEY } : {}) },
    body: JSON.stringify(hosted ? { model, messages, temperature: 0.1, max_tokens: tokens } :
      { model, messages, stream: false, options: { temperature: 0.1, seed: 31, num_predict: tokens } }),
  });
  assert(response.ok, "HTTP " + response.status);
  const data = await response.json();
  assert.equal(data.model, model);
  assert(hosted ? data.choices[0].finish_reason === "stop" : data.done);
  return hosted ? data.choices[0].message.content : data.message.content;
}

for (const { id, trial, pack, fragments, absent } of examples) {
  const prompt = buildPrompt(pack, trial.questions[0], fragments);
  const hash = createHash("sha256").update(SYSTEM_PROMPT + "\0" + prompt).digest("hex").slice(0, 16);
  const started = Date.now();
  try {
    const proposed = parseModelAnswer(await generate(prompt));
    assert(proposed, "invalid JSON");
    const { answer, report } = validateAnswer(pack, fragments, proposed);
    const supplied = fragments.map(f => f.logicalId);
    const checks = absent ? { abstained: proposed.status === "insufficient_evidence" && proposed.claims.length === 0 && answer.citations.length === 0 } :
      { ...ragAssertions(trial, { turn: answer, retrieval: { top: supplied, evidence: supplied } }), retainedClaims: report.removedClaims === 0 };
    const failed = Object.keys(checks).filter(key => !checks[key]);
    console.log(JSON.stringify({ provider, id, hash, pass: !failed.length, status: answer.status, failed, ms: Date.now() - started }));
    if (failed.length) process.exitCode = 1;
  } catch (error) {
    console.log(JSON.stringify({ provider, id, hash, pass: false, status: error.name, ms: Date.now() - started }));
    process.exitCode = 1;
  }
}
