import { APICallError } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { askSherlock, parseQuestion } from "@/lib/zusik/sherlock";

function textResult(text: string) {
  return {
    content: [{ type: "text", text }],
    finishReason: { unified: "stop", raw: "stop" },
    usage: {
      inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
      outputTokens: { total: 10, text: 10, reasoning: 0 },
    },
    warnings: [],
  } as never;
}

const settings = (doGenerate: ConstructorParameters<typeof MockLanguageModelV4>[0]) => ({
  baseURL: "https://example.invalid/openai/v1",
  apiKey: "unused",
  model: "bielik-test",
  languageModel: new MockLanguageModelV4(doGenerate),
});

const FRAGMENT = "Rodzice wybierają, czy opiekują się dzieckiem razem, czy kolejno.";

describe("Sherlock contract", () => {
  it("parses JSON even inside a code fence", () => {
    expect(parseQuestion('```json\n{"question":"Razem czy kolejno?"}\n```')).toBe("Razem czy kolejno?");
    expect(parseQuestion("Nie wiem")).toBeNull();
    expect(parseQuestion('{"question":""}')).toBeNull();
  });

  it("returns the model question and status ok", async () => {
    const r = await askSherlock(settings({ doGenerate: textResult('{"question":"Marto, razem czy kolejno?"}') }), FRAGMENT);
    expect(r).toMatchObject({ status: "ok", question: "Marto, razem czy kolejno?", model: "bielik-test" });
  });

  it("marks invalid JSON", async () => {
    const r = await askSherlock(settings({ doGenerate: textResult("Oczywiście! Razem czy kolejno?") }), FRAGMENT);
    expect(r).toMatchObject({ status: "invalid_json", question: null });
  });

  it("marks 429 as rate_limited", async () => {
    const error = new APICallError({
      message: "Too Many Requests",
      url: "https://example.invalid",
      requestBodyValues: {},
      statusCode: 429,
      isRetryable: false,
    });
    const r = await askSherlock(settings({ doGenerate: async () => { throw error; } }), FRAGMENT);
    expect(r).toMatchObject({ status: "rate_limited", question: null });
  });

  it("marks a timeout", async () => {
    const r = await askSherlock(
      settings({
        doGenerate: async () => {
          throw new DOMException("The operation timed out.", "TimeoutError");
        },
      }),
      FRAGMENT,
    );
    expect(r).toMatchObject({ status: "timeout", question: null });
  });
});
