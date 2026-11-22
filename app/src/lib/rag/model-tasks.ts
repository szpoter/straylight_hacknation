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
  plan_public: "Na podstawie publicznego aspektu, poprzedniej jednostki, nazw brakujących pól i kandydatów wskaż zamiar i jedno narzędzie. Wybierz wyłącznie ID z candidates. Gdy pytanie dotyczy źródła wcześniejszej odpowiedzi, użyj readPreviousEvidence. Dla brakującej podstawy publicznej użyj fetchOfficialEvidence. Wybór narzędzia nie przyznaje świadczenia.",
  verify_claim: "Porównaj treść twierdzenia claim z dowodami candidates. Sprawdź podmiot, aspekt, przesłanki, daty, liczby i wyjątki. Każde wybrane ID musi pochodzić z candidates. Gdy brakuje dowodu, zwróć missing z pustą listą.",
};

export function checkedTaskOutput(input: PublicTaskInput, raw: string) {
  let json: unknown;
  try { json = JSON.parse(raw); } catch { return null; }
  const parsed = taskSpecs[input.kind].output.safeParse(json);
  if (!parsed.success || parsed.data.evidenceIds.some(id => !input.candidates.includes(id))) return null;
  if (input.kind === "plan_public" && "requiredFacts" in parsed.data &&
      parsed.data.requiredFacts.some(field => !input.missing.includes(field))) return null;
  if ("verdict" in parsed.data && parsed.data.verdict === "supported" && !parsed.data.evidenceIds.length) return null;
  return parsed.data;
}
