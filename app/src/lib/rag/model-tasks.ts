import { z } from "zod";

/** What Bielik must return. Ids and quotes are checked against the corpus afterwards. */
export const modelAnswerSchema = z.object({
  status: z.enum(["answered", "needs_clarification", "insufficient_evidence"]),
  message: z.string().max(400).default(""),
  claims: z
    .array(
      z.object({
        text: z.string().trim().min(1).max(400),
        evidence: z.array(z.object({ id: z.string().min(1), quote: z.string().min(1).max(600) })).min(1).max(3),
      }),
    )
    .max(3)
    .default([]),
});
export type ModelAnswer = z.infer<typeof modelAnswerSchema>;


/**
 * Bielik sometimes emits unbalanced brackets in compact JSON (e.g. `]}}]}}`).
 * Outside string literals: drop closers that do not match the open bracket, append missing closers.
 * Content is never invented; Zod and the citation validator still check everything.
 */
export function balanceJsonBrackets(json: string): string {
  const stack: string[] = [];
  let out = "";
  let inString = false;
  let escaped = false;
  for (const ch of json) {
    if (inString) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{" || ch === "[") stack.push(ch === "{" ? "}" : "]");
    else if (ch === "}" || ch === "]") {
      if (stack[stack.length - 1] !== ch) continue;
      stack.pop();
    }
    out += ch;
  }
  return inString ? out : out + stack.reverse().join("");
}

/** Bielik may wrap JSON in prose or code fences; take the outermost object. */
export function parseModelAnswer(raw: string): ModelAnswer | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  const candidate = raw.slice(start, end + 1);
  for (const text of [candidate, balanceJsonBrackets(candidate)]) {
    try {
      const parsed = modelAnswerSchema.safeParse(JSON.parse(text));
      if (parsed.success) return parsed.data;
    } catch {
      // try the repaired variant
    }
  }
  return null;
}

export const publicAspect = z.enum(["overview", "recipient", "deadline", "evidence", "eligibility", "amount", "comparison", "draft"]);
export const missingField = z.enum(["childAgeAtStart", "careType", "benefitDate", "employmentType", "facilityRegistered"]);
const unit = z.string().min(1).max(128);
const candidates = z.array(unit).max(5);
export const publicTaskInput = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("plan_public"), aspect: publicAspect, candidates,
    previousUnit: unit.optional(), missing: z.array(missingField).max(5) }),
  z.strictObject({ kind: z.literal("verify_claim"), aspect: publicAspect, claimUnit: unit, candidates }),
]);
export type PublicTaskInput = z.infer<typeof publicTaskInput>;

export const planOutput = z.strictObject({
  intent: z.enum(["explain", "follow_up", "cite_previous", "discover", "compare", "calculate", "prepare_form"]),
  nextTool: z.enum(["searchCorpus", "fetchOfficialEvidence", "askOneFact", "listOpportunities", "runRule", "prepareDraft", "readPreviousEvidence"]),
  evidenceIds: z.array(unit).max(5), requiredFacts: z.array(missingField).max(5),
});
export const verdictOutput = z.strictObject({ verdict: z.enum(["supported", "partial", "contradicted", "missing"]), evidenceIds: z.array(unit).max(5) });
export const TYPED_CONTEXT_TOKENS = 4096;
export const taskSpecs = {
  answer_evidence: { output: modelAnswerSchema, tokens: 700, timeout: 38000 },
  plan_public: { output: planOutput, tokens: 150, timeout: 9000 },
  verify_claim: { output: verdictOutput, tokens: 100, timeout: 9000 },
} as const;
export type ModelTaskKind = keyof typeof taskSpecs;
export const localModelIds = {
  bielik: "SpeakLeash/bielik-11b-v3.1-instruct:Q4_K_M",
  pllum: "hf.co/mradermacher/PLLuM-12B-chat-2512-GGUF:Q4_K_M",
} as const;

export const taskInstructions = {
  plan_public: "Na podstawie publicznego aspektu, poprzedniej jednostki, nazw brakujących pól i kandydatów wskaż zamiar i jedno narzędzie. Wybierz wyłącznie ID z candidates. Gdy pytanie dotyczy źródła wcześniejszej odpowiedzi, użyj readPreviousEvidence. Aspekt evidence z previousUnit oznacza prośbę o źródło poprzedniej odpowiedzi: intent cite_previous, narzędzie readPreviousEvidence. follow_up oznacza nowe pytanie o inny aspekt. Dla brakującej podstawy publicznej użyj fetchOfficialEvidence. Wybór narzędzia nie przyznaje świadczenia.",
  verify_claim: "Porównaj treść twierdzenia claim z dowodami candidates. Sprawdź podmiot, aspekt, przesłanki, daty, liczby i wyjątki. Każde wybrane ID musi pochodzić z candidates. Gdy dowody dotyczą innego warunku, dokumentu albo terminu, zwróć missing z pustą listą. partial wymaga potwierdzenia przynajmniej jednego konkretnego elementu twierdzenia. Wspólny temat ogólny nie potwierdza elementu twierdzenia.",
};

export function checkedTaskOutput(input: PublicTaskInput, raw: string) {
  let json: unknown;
  try { json = JSON.parse(raw); } catch { return null; }
  const parsed = taskSpecs[input.kind].output.safeParse(json);
  if (!parsed.success || parsed.data.evidenceIds.some(id => !input.candidates.includes(id))) return null;
  if (input.kind === "plan_public" && "requiredFacts" in parsed.data) {
    const plan = parsed.data;
    if (plan.requiredFacts.some(field => !input.missing.includes(field))) return null;
    if (plan.nextTool === "prepareDraft" && (input.aspect !== "draft" || plan.intent !== "prepare_form")) return null;
    if (plan.nextTool === "runRule" && (plan.intent !== "calculate" || !["amount", "eligibility"].includes(input.aspect))) return null;
    if (plan.nextTool === "readPreviousEvidence" && !input.previousUnit) return null;
    if (plan.nextTool === "askOneFact" && !plan.requiredFacts.length) return null;
  }
  if ("verdict" in parsed.data && parsed.data.verdict === "supported" && !parsed.data.evidenceIds.length) return null;
  return parsed.data;
}

/** Limit the decoding grammar to identifiers the server actually supplied in this prompt. */
export function taskGrammar(kind: ModelTaskKind, input?: { candidates: {id:string}[]; missing?: string[] }) {
  const schema = z.toJSONSchema(taskSpecs[kind].output);
  if (!input || kind === "answer_evidence" || !schema.properties) return schema;
  const ids = input.candidates.map(candidate => candidate.id);
  schema.properties.evidenceIds = ids.length
    ? { type:"array", maxItems:ids.length, items:{type:"string", enum:ids} }
    : {type:"array", maxItems:0, items:{type:"string"}};
  if (kind === "plan_public") {
    const fields = input.missing ?? [];
    schema.properties.requiredFacts = fields.length
      ? { type:"array", maxItems:fields.length, items:{type:"string", enum:fields} }
      : {type:"array", maxItems:0, items:{type:"string"}};
  }
  return schema;
}
