import { afterEach, expect, it, vi } from "vitest";
import { maxDuration as legacyDuration, POST } from "../src/app/api/zusik/ask/route";
import { maxDuration as caseDuration } from "../src/app/api/v1/[...path]/route";
import { publicReply } from "../src/lib/zusik/v1/public";
import { caseApi } from "../src/features/chat/case-api";
import type { ChatModelOptions } from "../src/lib/zusik/chat-model";

const stubs = vi.hoisted(() => ({
  askService: vi.fn(() => ({ask: async () => ({status: 200, turn: null, trace: null})})),
  publicAnswerDeps: vi.fn(() => ({})),
}));
vi.mock("../src/lib/zusik/server", () => ({...stubs, currentSessionId: async () => "synthetic", NO_STORE: {}}));
vi.mock("../src/lib/zusik/ask-service", () => ({answerPublicTurn: async () => ({
  answer: {status: "answered", claims: [], citations: [], message: "Test"}, trace: {},
})}));

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it("allows the full public Qwen request at both route entry points", () => {
  expect([legacyDuration, caseDuration]).toEqual([125, 125]);
});
it.each([undefined, "bielik", "pllum", "qwen-27b"] as const)("budgets %s across public HTTP and client layers", async model => {
  const selected: ChatModelOptions | undefined = model ? {model} : undefined;
  const now = 200_000;
  vi.spyOn(Date, "now").mockReturnValue(now);
  const question = "Kiedy złożyć wniosek o urlop rodzicielski?";
  const request = new Request("https://synthetic.test/api/zusik/ask", {method:"POST",
    headers: {Origin:"https://synthetic.test", Host:"synthetic.test", "Content-Type":"application/json"},
    body: JSON.stringify({question, requestId:"synthetic-id", modelOptions:selected})});
  expect((await POST(request)).status).toBe(200);
  expect(stubs.askService).toHaveBeenLastCalledWith(now + (model === "qwen-27b" ? 110_000 : 55_000), selected);
  await publicReply(question, undefined, selected, undefined, now - 3_000);
  expect(stubs.publicAnswerDeps).toHaveBeenLastCalledWith(now + (model === "qwen-27b" ? 107_000 : 48_000), selected);

  const timer = vi.spyOn(AbortSignal, "timeout");
  const fetch = vi.fn(async () => Response.json({}));
  vi.stubGlobal("fetch", fetch);
  await caseApi.message("test", {intent:"public_question", publicQuestion:question, modelOptions:selected}, "synthetic-id");
  expect(timer).toHaveBeenLastCalledWith(model === "qwen-27b" ? 125_000 : 70_000);
  expect(fetch).toHaveBeenCalledWith("/api/v1/cases/test/messages", expect.objectContaining({headers: expect.any(Headers)}));
  await caseApi.message("test", {intent:"ask_case"}, "synthetic-id");
  expect(timer).toHaveBeenLastCalledWith(70_000);
});
