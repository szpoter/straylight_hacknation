/** Run in app/: node --import tsx scripts/zusik-eval-local-models.ts. Only local Ollama and public fragments. */
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { totalmem } from "node:os";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { taskGrammar, taskSpecs, taskInstructions, localModelIds, checkedTaskOutput, type PublicTaskInput, type ModelTaskKind } from "../src/lib/rag/model-tasks";
import {
  ASK_MAX_OUTPUT_TOKENS,
  ASK_MODEL_BUDGET_MS,
  ASK_TIMEOUT_MS,
  buildPrompt,
  generateAnswer,
  SYSTEM_PROMPT,
  validateAnswer,
} from "../src/lib/rag/answer";
import { loadCorpus } from "../src/lib/rag/corpus-fs";

const endpoint = "http://127.0.0.1:11434/v1";
const models = Object.values(localModelIds);
const attach = "rozp-2025-322-par15-ust2-pkt1",
  exception = "rozp-2025-322-par22",
  deadline = "kp-art182-1d-par1";
const examples = [
  {
    id: "odpis",
    question:
      "Kadry mają już odpis aktu dziecka w moich aktach osobowych. Czy do wniosku o urlop rodzicielski mam dołączyć drugi?",
    evidence: [attach, exception, "rozp-2025-322-par15-ust2-pkt2"],
    gold: [attach, exception],
    expected: "answered",
    meaning: (s: string) =>
      /nie (?:musisz|trzeba|dołącza|jest konieczn|ma potrzeby)|nie jest potrzebn/i.test(s) &&
      /aktach|akt osobow|dokument.*posiada/i.test(s),
  },
  {
    id: "termin",
    question: "Ile dni wcześniej trzeba złożyć wniosek o urlop rodzicielski i do kogo go składam?",
    evidence: [deadline, "rozp-2025-322-par15-ust2-pkt2"],
    gold: [deadline],
    expected: "answered",
    meaning: (s: string) => /21 dni/i.test(s) && /pracodawc/i.test(s),
  },
  {
    id: "brak-podstawy",
    question:
      "Czy na podstawie tych przepisów można odmówić zasiłku chorobowego z powodu samego kodu B na zwolnieniu?",
    evidence: [attach, exception],
    gold: [],
    expected: "insufficient_evidence",
    meaning: (s: string) => !/(?:należy|trzeba) odmówić|nie przysługuje/iu.test(s),
  },
];

async function runExample(model: string, e: (typeof examples)[number], corpus: ReturnType<typeof loadCorpus>) {
  const evidence = e.evidence.map((id) => {
    const fragment = corpus.fragments.get(id);
    if (!fragment) throw new Error("Nieznany fragment " + id);
    return fragment;
  });
  const promptHash = createHash("sha256")
    .update(SYSTEM_PROMPT + "\n" + buildPrompt(corpus, e.question, evidence))
    .digest("hex")
    .slice(0, 12);
  const generation = await generateAnswer(
    { baseURL: endpoint, apiKey: "ollama", model },
    corpus,
    e.question,
    evidence,
  );
  const checked = generation.output && validateAnswer(corpus, evidence, generation.output);
  const cited = checked?.answer.citations.map((c) => c.fragmentId) ?? [];
  const pairs = generation.output?.claims.flatMap((c) => c.evidence) ?? [];
  const text = checked
    ? [checked.answer.message, ...checked.answer.claims.map((c) => c.text)].join(" ").trim()
    : "";
  const missing = e.gold.filter((id) => !cited.includes(id));
  const rejected = checked?.report.rejectedEvidence.length ?? 0;
  const correct =
    !!checked &&
    generation.output?.status === e.expected &&
    checked.answer.status === e.expected &&
    e.meaning(text) &&
    !missing.length &&
    !rejected &&
    (e.expected === "insufficient_evidence"
      ? !generation.output.claims.length
      : checked.report.removedClaims === 0);
  return {
    model,
    e,
    promptHash,
    ms: generation.ms,
    status: generation.status,
    raw: generation.output?.status ?? "—",
    output: checked?.answer.status ?? "—",
    pairs: pairs.length,
    valid: pairs.length - rejected,
    cited,
    missing,
    correct,
    text,
  };
}

async function compareRoles() {
  // Dedicated loopback daemon. Unloading a model here never evicts the serving worker's model.
  const base = "http://127.0.0.1:11439/api";
  const call = async (path: string, body?: object) => {
    const response = await fetch(base + path, {
      method: body ? "POST" : "GET",
      redirect: "error",
      signal: AbortSignal.timeout(120000),
      headers: { "content-type": "application/json" },
      body: body && JSON.stringify(body),
    });
    if (!response.ok) throw Error(path + " HTTP " + response.status);
    return response.json();
  };
  const inventory = await call("/tags");
  const runnerSha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const corpus = loadCorpus("marta");
  const units = examples[0].evidence.map((id) => {
    const f = corpus.fragments.get(id);
    if (!f) throw Error("Missing public evidence " + id);
    return f;
  });
  const attachments = units.map((f) => ({ id: f.logicalId, text: f.sourceText }));
  const plan: PublicTaskInput = {
    kind: "plan_public",
    aspect: "evidence",
    previousUnit: exception,
    candidates: [exception],
    missing: [],
  };
  const verify: PublicTaskInput = {
    kind: "verify_claim",
    aspect: "eligibility",
    claimUnit: deadline,
    candidates: [exception],
  };
  const tasks: { kind: ModelTaskKind; prompt: string; system: string; correct: (s: string) => boolean }[] = [
    {
      kind: "answer_evidence",
      system: SYSTEM_PROMPT,
      prompt: buildPrompt(corpus, examples[0].question, units),
      correct(raw) {
        const proposed = taskSpecs.answer_evidence.output.parse(JSON.parse(raw));
        const checked = validateAnswer(corpus, units, proposed);
        return (
          checked.answer.status === "answered" &&
          [attach, exception].every((id) => checked.answer.citations.some((c) => c.fragmentId === id)) &&
          examples[0].meaning(checked.answer.claims.map((c) => c.text).join(" "))
        );
      },
    },
    {
      kind: "plan_public",
      system: taskInstructions.plan_public,
      prompt: JSON.stringify({ ...plan, candidates: [attachments[1]] }),
      correct(raw) {
        const v = checkedTaskOutput(plan, raw);
        return (
          !!v && "nextTool" in v && v.nextTool === "readPreviousEvidence" && v.intent === "cite_previous"
        );
      },
    },
    {
      kind: "verify_claim",
      system: taskInstructions.verify_claim,
      prompt: JSON.stringify({
        aspect: verify.aspect,
        claim: corpus.fragments.get(deadline)?.sourceText,
        candidates: [attachments[1]],
      }),
      correct(raw) {
        const v = checkedTaskOutput(verify, raw);
        return !!v && "verdict" in v && v.verdict === "missing";
      },
    },
  ];
  const supplementary = process.argv.includes("--supplementary");
  const selectedTasks = supplementary ? tasks.filter(t => t.kind !== "answer_evidence") : tasks;
  const reportFile = supplementary ? "corpus/local-model-routing.json" : "corpus/local-model-roles.json";
  const results = [];
  for (const model of models) {
    for (const t of selectedTasks) {
      for (let run = 0; run < 6; run++) {
        const cold = run % 2 === 0;
        if (cold) {
          await call("/generate", { model, keep_alive: 0 });
          const limit = Date.now() + 20000;
          while (
            (await call("/ps")).models.some((m: { model: string }) => m.model === model) &&
            Date.now() < limit
          )
            await new Promise((resolve) => setTimeout(resolve, 250));
        }
        const already = (await call("/ps")).models.some((m: { model: string }) => m.model === model);
        if (already === cold) throw Error("Unexpected model residency");
        const spec = taskSpecs[t.kind],
          id = randomUUID(),
          start = performance.now();
        const res = await call("/chat", {
          model,
          stream: false,
          format: taskGrammar(t.kind,t.kind === "answer_evidence" ? undefined : JSON.parse(t.prompt)),
          options: { temperature: 0.1, num_predict: spec.tokens },
          messages: [
            { role: "system", content: t.system },
            { role: "user", content: t.prompt },
          ],
        });
        const ms = Math.round(performance.now() - start);
        const loaded = (await call("/ps")).models.find((m: { model: string }) => m.model === model);
        let json = false,
          correct = false;
        try {
          json = spec.output.safeParse(JSON.parse(res.message.content)).success;
          correct = t.correct(res.message.content);
        } catch {
          /* Invalid generation counts as a miss. */
        }
        const modelOutput = json ? JSON.parse(res.message.content) : null;
        const detail =
          t.kind === "answer_evidence" && modelOutput
            ? {
                selectedIds: modelOutput.claims.flatMap((c: { evidence: { id: string }[] }) =>
                  c.evidence.map((e) => e.id),
                ),
                exception: examples[0].meaning(
                  modelOutput.claims.map((c: { text: string }) => c.text).join(" "),
                ),
              }
            : modelOutput;
        const row = {
          model,
          task: t.kind,
          cold,
          attemptId: id,
          ms,
          detail,
          loadMs: Math.round(res.load_duration / 1e6),
          residentBytes: loaded?.size,
          vramBytes: loaded?.size_vram,
          json,
          correct,
          withinBudget: ms <= spec.timeout,
          stop: res.done_reason,
        };
        results.push(row);
        console.log(JSON.stringify(row));
        writeFileSync(
          reportFile,
          JSON.stringify(
            {
              runnerSha,
              models: inventory.models.filter((m: { model: string }) => models.some((id) => id === m.model)),
              hostBytes: totalmem(),
              measuredAt: new Date().toISOString(),
              results,
            },
            null,
            2,
          ) + "\n",
        );
      }
    }
  }
  const groups = [];
  for (const model of models)
    for (const { kind } of selectedTasks)
      for (const cold of [true, false]) {
        const sample = results.filter((r) => r.model === model && r.task === kind && r.cold === cold);
        const lat = sample.map((r) => r.ms).sort((a, b) => a - b);
        groups.push({
          model,
          kind,
          cold,
          n: sample.length,
          p50: lat[Math.ceil(lat.length * 0.5) - 1],
          p95: lat[Math.ceil(lat.length * 0.95) - 1],
          schema: sample.filter((r) => r.json).length,
          correct: sample.filter((r) => r.correct).length,
          inBudget: sample.filter((r) => r.withinBudget).length,
        });
      }
  writeFileSync(
    reportFile,
    JSON.stringify(
      {
        runnerSha,
        models: inventory.models.filter((m: { model: string }) => models.some((id) => id === m.model)),
        hostBytes: totalmem(),
        measuredAt: new Date().toISOString(),
        groups,
        results,
      },
      null,
      2,
    ) + "\n",
  );
}

async function main() {
  const modelsResponse = await fetch(endpoint + "/models", { signal: AbortSignal.timeout(5_000) });
  if (!modelsResponse.ok) throw new Error("Nie można pobrać listy modeli z lokalnej Ollamy.");
  const inventory = (await modelsResponse.json()) as { data: { id: string }[] };
  for (const m of models)
    if (!inventory.data.some((v) => v.id === m)) throw new Error("Brakuje lokalnego modelu " + m);
  const corpus = loadCorpus("marta");
  const results: Awaited<ReturnType<typeof runExample>>[] = [];
  for (const model of models) {
    for (const e of examples) {
      const result = await runExample(model, e, corpus);
      results.push(result);
      console.log(
        model,
        e.id,
        result.ms + "ms",
        result.raw,
        result.output,
        result.correct ? "PASS" : "FAIL",
        result.cited.join(","),
      );
    }
  }
  const seconds = (ms: number) => (ms / 1000).toFixed(1);
  const report = [
    "# Porównanie lokalnego Bielika i PLLuM",
    "",
    "Pomiar z " +
      new Date().toISOString() +
      ". Oba modele wykonały te same trzy zadania po kolei na lokalnym endpointcie Ollamy. Skrypt używa funkcji produkcyjnych `generateAnswer` i `validateAnswer`. Każde pytanie dostaje od dwóch do trzech jawnie wskazanych publicznych fragmentów korpusu `" +
      corpus.manifest.corpusVersion +
      "`. Identyczny skrót promptu w dwóch wierszach oznacza ten sam prompt systemowy, pytanie, fragmenty i instrukcję.",
    "",
    "Temperatura 0,1. Limit wyjścia " +
      ASK_MAX_OUTPUT_TOKENS +
      " tokenów. Limit jednej próby wynosi " +
      seconds(ASK_TIMEOUT_MS) +
      " s, a wspólny budżet generatora z ewentualną ponowną próbą " +
      seconds(ASK_MODEL_BUDGET_MS) +
      " s. Pomiar obejmuje oczekiwanie na odpowiedź modelu, w tym ewentualne ładowanie wag. Nie uwzględnia czasu Qdrant, Neon i sieci do Vercela. Jedna obserwacja na parę model–pytanie nie wystarcza do oszacowania p95.",
    "",
    "| Model | Zadanie | Czas | Generacja | Stan surowy → zweryfikowany | Cytaty zgodne / zwrócone | Brakujące źródła | Odbiór | Skrót promptu |",
    "|---|---|---:|---|---|---:|---|---|---|",
    ...results.map(
      (r) =>
        "| " +
        [
          r.model,
          r.e.id,
          seconds(r.ms) + " s",
          r.status,
          r.raw + " → " + r.output,
          r.valid + " / " + r.pairs,
          r.missing.join(", ") || "—",
          r.correct ? "PASS" : "FAIL",
          r.promptHash,
        ].join(" | ") +
        " |",
    ),
    "",
    "Odbiór sprawdza spodziewany stan modelu przed walidacją i po niej, treść odpowiedzi, obecność wymaganych identyfikatorów oraz poprawność wskazanych cytatów według walidatora aplikacji. Przy braku podstawy nie może pojawić się żadne twierdzenie. Dla odpisu wymagane są zarówno reguła załącznika, jak i wyjątek dotyczący akt osobowych. Liczba 0 / 0 oznacza brak przytoczonego cytatu.",
    "",
    "## Zestaw pytań",
    "",
    ...examples.map(
      (e) =>
        "- **" +
        e.id +
        "**. " +
        e.question +
        " Fragmenty: " +
        e.evidence.map((id) => "`" + id + "`").join(", ") +
        ".",
    ),
    "",
    "## Wyniki modeli",
    "",
    ...models.map((m) => {
      const rows = results.filter((r) => r.model === m);
      return (
        "- **" +
        m +
        "**. Odbiór " +
        rows.filter((r) => r.correct).length +
        "/" +
        rows.length +
        ", ukończone generacje w budżecie " +
        rows.filter((r) => r.status === "ok" && r.ms <= ASK_MODEL_BUDGET_MS).length +
        "/" +
        rows.length +
        "."
      );
    }),
    "",
    ...results
      .filter((r) => r.e.expected === "insufficient_evidence" && r.output === "answered")
      .map(
        (r) =>
          "W próbie bez podstawy model " +
          r.model +
          " opublikował twierdzenie mimo dostarczenia wyłącznie przepisów o dokumentach do wniosku urlopowego. Walidator zaakceptował dosłowny cytat z " +
          r.cited.map((id) => "`" + id + "`").join(", ") +
          ". To błąd trafności źródła. W tej próbie sama kontrola zgodności cytatu z fragmentem nie zatrzymała odpowiedzi.",
      ),
    "",
    "Powtórzenie z katalogu app: `node --import tsx scripts/zusik-eval-local-models.ts`. Modele muszą istnieć pod nazwami podanymi w tabeli. Skrypt nadpisuje wyłącznie ten raport.",
    "",
  ];
  writeFileSync("corpus/local-models.md", report.join("\n"));
}
(process.argv.includes("--roles") ? compareRoles() : main()).catch((e: Error) => {
  console.error(e.message);
  process.exitCode = 1;
});
