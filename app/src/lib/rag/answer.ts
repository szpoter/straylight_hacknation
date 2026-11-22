import type { Pool } from "pg";
import { localCompletion, publicQueueEvidence, type LocalModel } from "./local-queue";
import { chatModel, localRagModel } from "../zusik/model-provider";
import { generateText, type LanguageModel } from "ai";
import { classifySherlockError } from "../zusik/sherlock";
import type { AskAnswer, AskCitation, AskClaim } from "../zusik/types";
import { citationUrl, normalizeSpaces, type Corpus, type Fragment } from "./corpus";
import { contradictsQuotedBenefit } from "./benefit-scope";

/** Bielik on Sherlock writes ~18 tokens/s; a cited answer is 200–400 tokens. Route maxDuration is 60 s. */
export const ASK_TIMEOUT_MS = 40_000;
export const ASK_MAX_OUTPUT_TOKENS = 700;

export const NO_BASIS_MESSAGE =
  "Nie znalazłem w tych źródłach podstawy, żeby na to odpowiedzieć. To nie znaczy, że takie prawo nie istnieje.";

export { SYSTEM_PROMPT, balanceJsonBrackets, modelAnswerSchema, parseModelAnswer, type ModelAnswer } from "./model-tasks";
import { SYSTEM_PROMPT, localModelIds, parseModelAnswer, type ModelAnswer } from "./model-tasks";

export const ANSWER_INSTRUCTION = [
  "Odpowiedz po polsku, maksymalnie trzema krótkimi twierdzeniami, zwracając się do rodzica na „Ty”.",
  "Pierwsze twierdzenie to bezpośrednia odpowiedź na pytanie.",
  "Każdemu twierdzeniu przypisz ID dostarczonego dowodu i krótki dosłowny urywek: 5–15 kolejnych słów skopiowanych znak w znak z tego fragmentu.",
  "Liczby podawaj dokładnie tak, jak stoją we fragmencie. Niczego nie sumuj, nie odejmuj i nie wyliczaj.",
  "Cytuj tylko fragment, który dotyczy tej samej sytuacji, o którą pyta rodzic. Fragment o innym rodzaju wniosku nie jest dowodem.",
  "Przy odpowiedzi pole message zostaw puste albo zadaj w nim jedno pytanie uzupełniające. Treść prawną podawaj tylko w claims.",
  "Jeśli pytanie wymaga nowych faktów o sytuacji rodzica, ustaw status needs_clarification i w message zadaj jedno pytanie.",
  "Jeśli zabrakło podstawy, ustaw status insufficient_evidence i zwróć pustą listę claims. Brak podstawy nie oznacza braku prawa.",
  "„Drugi rodzic” oznacza drugiego rodzica dziecka. Oświadczenie o drugim rodzicu składa pracownik we własnym wniosku.",
  'Zwróć wyłącznie zwarty JSON w jednej linii, bez formatowania i bez komentarza: {"status":"answered|needs_clarification|insufficient_evidence","message":"","claims":[{"text":"...","evidence":[{"id":"...","quote":"..."}]}]}',
].join("\n");

export function buildPrompt(corpus: Corpus, question: string, evidence: Fragment[]): string {
  const blocks = evidence.map((f) => {
    const doc = corpus.documents.get(f.documentId);
    return `[ID: ${f.logicalId}] ${doc?.shortTitle ?? ""}, ${f.locator} · temat: ${f.context}\n"""${f.sourceText}"""`;
  });
  return `Pytanie rodzica:\n"""${question}"""\n\nFragmenty źródłowe:\n${blocks.join("\n\n")}\n\n${ANSWER_INSTRUCTION}`;
}

/** Typographic quote marks are equivalent for matching („Za życiem” vs "Za życiem"). */
function plainQuotes(text: string): string {
  return text.replace(/[„”“"«»]/g, '"');
}

/**
 * Finds the quote in the unit. An elided quote ("A […] B") matches when every piece occurs
 * verbatim, in order, each at least MIN_QUOTE_CHARS long. Returns the matched display text or null.
 */
export function locateQuote(sourceText: string, rawQuote: string, forClaim = false): string | null {
  const source = plainQuotes(normalizeSpaces(sourceText));
  const pieces = rawQuote
    .split(/\[\s*(?:\.\.\.|…)\s*\]|\(\s*(?:\.\.\.|…)\s*\)|…|\.\.\./)
    .map((p) => plainQuotes(cleanQuote(p)))
    .filter((p) => p.length > 0);
  if (pieces.length === 0 || pieces.some((p) => p.length < MIN_QUOTE_CHARS)) return null;
  let from = 0;
  const found: string[] = [];
  for (const piece of pieces) {
    let at = source.indexOf(piece, from);
    // A literal substring can invert the law by cutting off „nie” or starting inside „niezdolność”.
    while (forClaim && at >= 0) {
      const cutsWord = /\p{L}$/u.test(source.slice(0, at)) && /^\p{L}/u.test(piece) ||
        /\p{L}$/u.test(piece) && /^\p{L}/u.test(source.slice(at + piece.length));
      if (!cutsWord && !/(?<!\p{L})nie\s+$/iu.test(source.slice(from, at))) break;
      at = source.indexOf(piece, at + 1);
    }
    if (at < 0) return null;
    found.push(normalizeSpaces(sourceText).slice(at, at + piece.length));
    from = at + piece.length;
  }
  return found.join(" […] ");
}

/** Strips wrapping quotes, ellipses and edge punctuation the model tends to add. */
function cleanQuote(quote: string): string {
  return normalizeSpaces(quote)
    .replace(/^[\s"'„”“«»….,;:–-]+/, "")
    .replace(/[\s"'„”“«»…,;:–-]+$/, "")
    .trim();
}

const MIN_QUOTE_CHARS = 12;
const AMOUNT_IN_TEXT = /\d[\d\s]*(zł|złotych|PLN)(?![\p{L}])/iu;
/** A provision number or a duration in another unit cannot support a deadline or a rate. */
function quantities(text: string): string[] {
  const pattern = /(\d+(?:[.,]\d+)?)\s*(?:(dni\p{L}*|dzień)|(tygod\p{L}*|tydzień)|(miesi(?:ąc|ęc)\p{L}*)|(lata\p{L}*|lat|rok\p{L}*)|(%|proc\.|procent\p{L}*))(?!\p{L})/giu;
  return Array.from(text.matchAll(pattern), ([, value, ...units]) =>
    value.replace(",", ".") + ":" + units.findIndex(Boolean));
}
/**
 * Exemption guard: a claim that releases the parent from something ("nie musisz", "nie trzeba",
 * "nie dołącza") needs a quote that itself contains a negation. Catches "you don't have to attach it"
 * cited to a unit that says "attach it".
 */
const EXEMPTION = /nie (musisz|musi|trzeba|dołącza|dołączasz|składa|ma potrzeby|jest konieczn|jest wymagan|wymaga)/iu;
const NEGATIVE_QUOTE = /(?<![\p{L}])nie(?![\p{L}])/iu;

function entitlementPolarity(text: string) {
  return Array.from(text.matchAll(/(?<!\p{L})(nie\s+)?przysługu(?:je|ją)(?!\p{L})/giu), match => Boolean(match[1]));
}

export interface ValidationReport {
  removedClaims: number;
  /** Quotes are public corpus text; route logs keep only id and reason. */
  rejectedEvidence: Array<{ id: string; reason: "unknown_id" | "quote_not_found" | "quote_too_short"; quote?: string }>;
  /** Exemption claims removed because none of their quotes contains a negation. */
  polarityRemoved: number;
}

/**
 * Publishes only what the evidence supports:
 * each citation must point to a fragment handed to the model (active version)
 * and its quote must occur verbatim after whitespace normalisation.
 * URL, title, page and authority come from the manifest, never from the model.
 */
export function validateAnswer(
  corpus: Corpus,
  evidence: Fragment[],
  output: ModelAnswer,
): { answer: AskAnswer; report: ValidationReport } {
  const version = corpus.manifest.corpusVersion;
  const allowed = new Map(evidence.map((f) => [f.logicalId, f]));
  const report: ValidationReport = { removedClaims: 0, rejectedEvidence: [], polarityRemoved: 0 };
  const citations: AskCitation[] = [];
  const claims: AskClaim[] = [];
  let firstClaimRemoved = false;

  output.claims.forEach((claim, index) => {
    const ids: string[] = [];
    for (const item of claim.evidence) {
      const fragment = allowed.get(item.id);
      if (!fragment) {
        report.rejectedEvidence.push({ id: item.id, reason: "unknown_id" });
        continue;
      }
      if (cleanQuote(item.quote).length < MIN_QUOTE_CHARS) {
        report.rejectedEvidence.push({ id: item.id, reason: "quote_too_short" });
        continue;
      }
      const quote = locateQuote(fragment.sourceText, item.quote, true);
      if (!quote) {
        report.rejectedEvidence.push({ id: item.id, reason: "quote_not_found", quote: item.quote.slice(0, 300) });
        continue;
      }
      let citation = citations.find((c) => c.fragmentId === fragment.logicalId && c.quote === quote);
      if (!citation) {
        const doc = corpus.documents.get(fragment.documentId)!;
        citation = {
          id: `c${citations.length + 1}`,
          fragmentId: fragment.logicalId,
          title: doc.shortTitle,
          locator: fragment.locator,
          url: citationUrl(corpus, fragment),
          quote,
          headingPath: fragment.headingPath,
          page: fragment.page,
          authority: doc.authority,
          corpusVersion: version,
        };
        citations.push(citation);
      }
      if (!ids.includes(citation.id)) ids.push(citation.id);
    }
    const quotes = ids.map((id) => citations.find((c) => c.id === id)!.quote);
    const cited = quotes.join(" ");
    const entitlements = entitlementPolarity(cited);
    const polarityMismatch = ids.length > 0 && (
      (EXEMPTION.test(claim.text) && !quotes.some(q => NEGATIVE_QUOTE.test(q))) ||
      (entitlements.length > 0 && entitlementPolarity(claim.text).some(negated => !entitlements.includes(negated)))
    );
    if (polarityMismatch) report.polarityRemoved += 1;
    const citedTexts = ids.flatMap((id) => {
      const citation = citations.find((c) => c.id === id);
      const fragment = citation && allowed.get(citation.fragmentId);
      return fragment ? [fragment.sourceText, fragment.locator] : [];
    });
    const sourceNumbers = new Set(citedTexts.join(" ").match(/\d+(?:[,.]\d+)?/g) ?? []);
    const unsupportedNumber = (claim.text.match(/\d+(?:[,.]\d+)?/g) ?? []).some((value) => !sourceNumbers.has(value));
    const quotedQuantities = new Set(quotes.flatMap(quantities));
    const unsupportedQuantity = quantities(claim.text).some(value => !quotedQuantities.has(value));
    if (ids.length === 0 || AMOUNT_IN_TEXT.test(claim.text) || polarityMismatch || contradictsQuotedBenefit(claim.text, cited) || unsupportedNumber || unsupportedQuantity) {
      report.removedClaims += 1;
      if (index === 0) firstClaimRemoved = true;
      return;
    }
    claims.push({ text: normalizeSpaces(claim.text), citationIds: ids });
  });

  const used = new Set(claims.flatMap((c) => c.citationIds));
  const usedCitations = citations.filter((c) => used.has(c.id));
  const message = normalizeSpaces(output.message);
  const insufficient = (msg = NO_BASIS_MESSAGE): AskAnswer => ({
    status: "insufficient_evidence",
    message: msg,
    claims: [],
    citations: [],
    corpusVersion: version,
  });

  if (output.status === "insufficient_evidence") {
    return { answer: insufficient(), report };
  }
  // Free-form model text must not smuggle an uncited eligibility verdict into a question.
  const followUp = /^(?:Czy|Kiedy|Jak(?:i|ie|iego|iej|ą)?|Któr(?:y|e|ego|ej|ą)|Ile|Od kiedy|Do kiedy|Kto|Gdzie|Na jaki|W jakim)\s[^.!?]{1,190}\?$/iu.test(message)
    && !/\d|przysługuje|należy ci się|masz prawo|odmow|odmaw/iu.test(message) ? message : "";
  if (output.status === "needs_clarification") {
    if (!followUp) return { answer: insufficient(), report };
    return {
      answer: { status: "needs_clarification", message: followUp, claims, citations: usedCitations, corpusVersion: version },
      report,
    };
  }
  // answered: the core (first claim) must survive validation.
  if (claims.length === 0 || firstClaimRemoved) return { answer: insufficient(), report };
  return {
    answer: {
      status: "answered",
      // Only a follow-up question may accompany the claims; legal content stays in claims.
      message: followUp,
      claims,
      citations: usedCitations,
      corpusVersion: version,
    },
    report,
  };
}

export type GenerationResult = (
  | { status: "ok" | "invalid_json" | "rate_limited" | "timeout" | "error"; output: ModelAnswer | null; model: string }
  | { status: "insufficient_evidence"; output: null; model?: never }
) & {
  ms: number;
  /** Diagnostics only (e.g. "stop", "length"); never the model text. */
  finishReason?: string;
  backend?: string;
  attemptId?: string;
};

type HostedSettings = { baseURL: string; apiKey: string; model: string };
export type AnswerModelSettings = (HostedSettings | { hosted: () => HostedSettings }) & {
  selectedModel?: LocalModel;
  reasoningEffort?: "low" | "high";
  languageModel?: LanguageModel;
  queue?: Pool;
  deadlineMs?: number;
};

/** Total model budget per question; leaves room for Qdrant and Neon inside maxDuration 60 s. */
export const ASK_MODEL_BUDGET_MS = 45_000;
/** A second attempt starts only if the first failed fast enough to leave this much time. */
const MIN_RETRY_WINDOW_MS = 15_000;

/**
 * Calls Bielik through the existing Sherlock (OpenAI-compatible) integration.
 * Invalid JSON or a transient error is retried once if the budget allows; a timeout or 429 is not.
 */
export async function generateAnswer(
  settings: AnswerModelSettings,
  corpus: Corpus,
  question: string,
  evidence: Fragment[],
): Promise<GenerationResult> {
  const started = Date.now();
  const deadline = Math.min(started + ASK_MODEL_BUDGET_MS, settings.deadlineMs ?? Infinity);
  const localOnly = settings.selectedModel === "pllum" || settings.selectedModel === "qwen-27b" ? settings.selectedModel : undefined;
  const hostedSettings = () => "hosted" in settings ? settings.hosted() : settings;
  if (!Number.isFinite(deadline) || deadline <= started)
    return { status: "timeout", output: null, model: localOnly ?? hostedSettings().model, ms: 0 };
  const effort = settings.selectedModel === "bielik" ? settings.reasoningEffort : undefined;
  const configuredLocal = !localOnly && settings.queue && !effort ? localRagModel() : null;
  const local = localOnly ?? (configuredLocal ? settings.selectedModel ?? configuredLocal : null);
  const prompt = buildPrompt(corpus, question, evidence);
  let attemptId: string | undefined;
  if (local && settings.queue && publicQueueEvidence(corpus, question, evidence)) {
    const result = await localCompletion(settings.queue, local, prompt, undefined, "answer_evidence", deadline - Date.now());
    attemptId = result.id;
    const output = result.status === "ok" ? parseModelAnswer(result.text) : null;
    const status = result.status === "ok" && !output ? "invalid_json" : result.status;
    const backend = "local-" + local;
    const ms = Date.now() - started;
    const attempt = { event: "rag_model_attempt", attemptId, backend, status, ms };
    if (output) {
      const model = local === "qwen-27b" ? localModelIds[local] : local;
      console.info(JSON.stringify({ ...attempt, model }));
      return { status: "ok", output, model, backend, attemptId, ms };
    }
    const canUseHosted = !localOnly && Date.now() + MIN_RETRY_WINDOW_MS < deadline;
    const fallback = canUseHosted ? "hosted" : local === "qwen-27b" ? "unavailable" : "source_only";
    console.info(JSON.stringify({ ...attempt, fallback }));
    if (!canUseHosted) return { status: "error", output: null, model: local, backend, attemptId, ms };
  } else if (localOnly === "qwen-27b" && settings.queue) {
    return { status: "insufficient_evidence", output: null, ms: Date.now() - started };
  } else if (localOnly) {
    return { status: "error", output: null, model: localOnly, backend: "local-" + localOnly, ms: Date.now() - started };
  } else if (local) {
    console.info(JSON.stringify({ event: "rag_model_attempt", status: "outside_queue_allowlist", fallback: "hosted" }));
  }
  const backend = "hosted";
  const hosted = hostedSettings();
  const hostedModel = effort ? "arklabsai/Bielik-11B-v3.1-Instruct" : hosted.model;
  const model = settings.languageModel ?? chatModel(hosted.baseURL, hosted.apiKey, hostedModel);
  let last: GenerationResult = { status: "error", output: null, model: hostedModel, backend, attemptId, ms: 0 };
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) return { ...last, status: "timeout", ms: Date.now() - started };
    if (attempt > 1 && remaining < MIN_RETRY_WINDOW_MS) break;
    try {
      const { text, finishReason } = await generateText({
        model,
        system: SYSTEM_PROMPT,
        prompt,
        temperature: 0.1,
        maxOutputTokens: effort === "high" ? 1400 : ASK_MAX_OUTPUT_TOKENS,
        providerOptions: effort ? { sherlock: { reasoningEffort: effort } } : undefined,
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(Math.min(ASK_TIMEOUT_MS, remaining)),
      });
      const output = parseModelAnswer(text);
      last = { status: output ? "ok" : "invalid_json", output, model: hostedModel, backend, attemptId, ms: Date.now() - started, finishReason };
      if (output) {
        if (settings.queue) console.info(JSON.stringify({ event: "rag_model_attempt", attemptId, backend, status: "ok", ms: last.ms }));
        return last;
      }
      console.error(JSON.stringify({ event: "ask_model_invalid_json", attempt, finishReason, chars: text.length }));
    } catch (error) {
      const status = classifySherlockError(error);
      console.error(JSON.stringify({ event: "ask_model_error", attempt, status, ms: Date.now() - started, error: (error as Error)?.name }));
      const mapped = status === "rate_limited" || status === "timeout" ? status : "error";
      last = { status: mapped, output: null, model: hostedModel, backend, attemptId, ms: Date.now() - started };
      // A timeout used the budget; a 429 will not clear within this request.
      if (mapped === "timeout" || mapped === "rate_limited") return last;
    }
  }
  return last;
}
