import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TurnView } from "../src/features/chat/turn-view";
import { afterEach, expect, it, vi } from "vitest";
import { caseApi } from "../src/features/chat/case-api";
import { chatModelOptions } from "../src/lib/zusik/chat-model";
import { messageInput } from "../src/lib/zusik/v1/conversation";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

it("sends only the explicit local model after reload and retains the Bielik preferences", async () => {
  const storage = new Map<string, string>();
  vi.stubGlobal("window", { sessionStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  } });
  const picker = await import("../src/features/chat/model-selection");
  expect(picker.getChatModelOptions()).toEqual({ model: "bielik", verification: "standard" });
  picker.setChatEffort("high");
  picker.setChatVerification("extra");
  picker.setChatModel("qwen-27b");
  vi.resetModules();
  const restored = await import("../src/features/chat/model-selection");
  expect(restored.getChatModelOptions()).toEqual({ model: "qwen-27b" });
  const modelOptions = restored.getChatModelOptions();
  expect(messageInput.safeParse({ intent:"public_question", publicQuestion:"Jakie są zasady?", modelOptions }).success).toBe(true);
  expect(messageInput.safeParse({ intent:"ask_case", modelOptions }).success).toBe(false);
  for (const extra of [{ effort: "high" }, { verification: "extra" }])
    expect(chatModelOptions.safeParse({ model: "qwen-27b", ...extra }).success).toBe(false);
  expect(chatModelOptions.safeParse({ model: "unknown-engine" }).success).toBe(false);
  restored.setChatModel("pllum");
  expect(restored.getChatModelOptions()).toEqual({ model: "pllum" });
  restored.setChatModel("bielik");
  expect(restored.getChatModelOptions()).toEqual({ model: "bielik", verification: "extra", effort: "high" });
});

it("distinguishes a selected model outage from other retryable failures", async () => {
  const fetch = vi.fn()
    .mockResolvedValueOnce(Response.json({code:"selected_model_unavailable"}, {status:503}))
    .mockResolvedValueOnce(Response.json({code:"public_source_unavailable"}, {status:503}))
    .mockResolvedValueOnce(new Response("Bad gateway", {status:503}));
  vi.stubGlobal("fetch", fetch);
  const send = () => caseApi.message("synthetic", {
    intent:"public_question", publicQuestion:"Ile trwa urlop?", modelOptions:{model:"qwen-27b"},
  }, "test-request");
  for (const code of ["selected_model_unavailable", "public_source_unavailable", undefined])
    await expect(send()).rejects.toMatchObject({status:503, code});
});

it("shows the public chat outage and retry action on the affected turn", () => {
  const message = "Qwen 3.8 27B (LM Studio) jest niedostępny.";
  const html = renderToStaticMarkup(createElement(TurnView, {
    item: {requestId:"synthetic", question:"Jakie są zasady?", state:"lost",
      answer:{status:"unavailable", message, claims:[], citations:[]}},
    activity:null, partialText:"", asking:false, onRetry:() => {},
  }));
  expect(html).toContain(message);
  expect(html).toContain("Ponów odpowiedź");
});
