import { chatModel } from "./model-provider";
import { APICallError, generateText, type LanguageModel } from "ai";
import { z } from "zod";
import { SHERLOCK_TIMEOUT_MS } from "./config";
import type { QuestionResult } from "./types";

export const questionSchema = z.object({ question: z.string().trim().min(1).max(240) });

export const QUESTION_INSTRUCTION =
  "Zapytaj Martę po polsku, czy wybiera wspólną opiekę, czy opiekę kolejno. Zwróć JSON z jednym polem question";

export interface SherlockSettings {
  baseURL: string;
  apiKey: string;
  model: string;
  /** Tests inject a mock model instead of the HTTP provider. */
  languageModel?: LanguageModel;
}

/** Bielik may wrap JSON in prose or code fences; take the first object. */
export function parseQuestion(raw: string): string | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = questionSchema.safeParse(JSON.parse(raw.slice(start, end + 1)));
    return parsed.success ? parsed.data.question : null;
  } catch {
    return null;
  }
}

export function classifySherlockError(error: unknown): QuestionResult["status"] {
  const seen = new Set<unknown>();
  let current: unknown = error;
  while (current && !seen.has(current)) {
    seen.add(current);
    if (APICallError.isInstance(current) && current.statusCode === 429) return "rate_limited";
    const name = (current as Error).name;
    if (name === "TimeoutError" || name === "AbortError") return "timeout";
    const nested = current as { lastError?: unknown; cause?: unknown };
    current = nested.lastError ?? nested.cause;
  }
  return "error";
}

export async function askSherlock(settings: SherlockSettings, fragmentText: string): Promise<QuestionResult> {
  const started = Date.now();
  const model =
    settings.languageModel ??
    chatModel(settings.baseURL, settings.apiKey, settings.model);
  try {
    const { text } = await generateText({
      model,
      system: "Jesteś Zusikiem, asystentem rodzica. Odpowiadasz wyłącznie na podstawie podanego fragmentu.",
      prompt: `Fragment źródłowy:\n"""${fragmentText}"""\n\n${QUESTION_INSTRUCTION}.`,
      temperature: 0.2,
      maxRetries: 1,
      abortSignal: AbortSignal.timeout(SHERLOCK_TIMEOUT_MS),
    });
    const question = parseQuestion(text);
    return {
      status: question ? "ok" : "invalid_json",
      question,
      model: settings.model,
      ms: Date.now() - started,
    };
  } catch (error) {
    const status = classifySherlockError(error);
    console.error(JSON.stringify({ event: "sherlock_error", status }));
    return { status, question: null, model: settings.model, ms: Date.now() - started };
  }
}
