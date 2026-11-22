import { afterEach, expect, it, vi } from "vitest";
import { maxDuration as legacyDuration, POST } from "../src/app/api/zusik/ask/route";
import { maxDuration as caseDuration } from "../src/app/api/v1/[...path]/route";
import { publicReply } from "../src/lib/zusik/v1/public";
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
it("uses the standard route limit at both entry points", () => {
  expect([legacyDuration, caseDuration]).toEqual([60, 60]);
});
it.each([undefined, "bielik", "pllum"] as const)("budgets %s across both public HTTP handlers", async model => {
  const selected: ChatModelOptions | undefined = model ? {model} : undefined;
  const now = 200_000;
  vi.spyOn(Date, "now").mockReturnValue(now);
  const question = "Kiedy złożyć wniosek o urlop rodzicielski?";
  const request = new Request("https://synthetic.test/api/zusik/ask", {method:"POST",
    headers: {Origin:"https://synthetic.test", Host:"synthetic.test", "Content-Type":"application/json"},
    body: JSON.stringify({question, requestId:"synthetic-id", modelOptions:selected})});
  expect((await POST(request)).status).toBe(200);
  expect(stubs.askService).toHaveBeenLastCalledWith(now + 55_000, selected);
  await publicReply(question, undefined, selected);
  expect(stubs.publicAnswerDeps).toHaveBeenLastCalledWith(now + 48_000, selected);

});
it("rejects the retired model before starting a legacy turn", async () => {
  stubs.askService.mockClear();
  const req = new Request("https://synthetic.test/api/zusik/ask", {method:"POST",
    headers:{Origin:"https://synthetic.test",Host:"synthetic.test","Content-Type":"application/json"},
    body: JSON.stringify({question:"Kiedy złożyć wniosek?",requestId:"synthetic-id",modelOptions:{model:"qwen-27b"}})});
  expect((await POST(req)).status).toBe(400);
  expect(stubs.askService).not.toHaveBeenCalled();
});
