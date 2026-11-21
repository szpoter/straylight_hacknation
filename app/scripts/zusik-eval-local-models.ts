/** Run in app/: node --import tsx scripts/zusik-eval-local-models.ts. Only local Ollama and public fragments. */
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
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
const models = [
  "SpeakLeash/bielik-11b-v3.1-instruct:Q4_K_M",
  "hf.co/mradermacher/PLLuM-12B-chat-2512-GGUF:Q4_K_M",
];
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
main().catch((e: Error) => {
  console.error(e.message);
  process.exitCode = 1;
});
