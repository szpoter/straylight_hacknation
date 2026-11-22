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

it("restores a retired model preference as Bielik and retains both Bielik settings", async () => {
  const storage = new Map<string, string>();
  vi.stubGlobal("window", { sessionStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  } });
  const picker = await import("../src/features/chat/model-selection");
  expect(picker.getChatModelOptions()).toEqual({ model: "bielik", verification: "standard" });
  picker.setChatEffort("high");
  picker.setChatVerification("extra");
  storage.set("zusik.chat.model", "qwen-27b");
  vi.resetModules();
  const restored = await import("../src/features/chat/model-selection");
  expect(restored.getChatModelOptions()).toEqual({ model: "bielik", verification: "extra", effort: "high" });
  const modelOptions = restored.getChatModelOptions();
  expect(messageInput.safeParse({ intent:"public_question", publicQuestion:"Jakie są zasady?", modelOptions }).success).toBe(true);
  expect(messageInput.safeParse({ intent:"ask_case", modelOptions }).success).toBe(false);
  expect(restored.modelOptionsForRetry({ model: "pllum" })).toEqual({ model: "pllum" });
  expect(chatModelOptions.safeParse({ model: "unknown-engine" }).success).toBe(false);
  restored.setChatModel("pllum");
  expect(restored.modelOptionsForRetry({ model: "qwen-27b" })).toEqual({ model: "bielik", verification: "extra", effort: "high" });
  expect(restored.getChatModelOptions()).toEqual({ model: "pllum" });
  restored.setChatModel("bielik");
  expect(restored.getChatModelOptions()).toEqual({ model: "bielik", verification: "extra", effort: "high" });
});

it("retries a retired model with Bielik, preserving the question and idempotency key", async () => {
  const fetch = vi.fn()
    .mockResolvedValueOnce(Response.json({code:"selected_model_unavailable"}, {status:503}))
    .mockResolvedValueOnce(Response.json({code:"public_source_unavailable"}, {status:503}))
    .mockResolvedValueOnce(new Response("Bad gateway", {status:503}));
  vi.stubGlobal("fetch", fetch);
  const send = () => caseApi.message("synthetic", {
    intent:"public_question", publicQuestion:"Ile trwa urlop?", modelOptions:{model:"qwen-27b"},
  }, "test-request");
  for (const code of ["selected_model_unavailable", "public_source_unavailable", undefined]) {
    await expect(send()).rejects.toMatchObject({status:503, code});
    const options = fetch.mock.lastCall?.[1];
    expect(JSON.parse(options.body)).toEqual({ intent:"public_question", publicQuestion:"Ile trwa urlop?",
      modelOptions:{ model:"bielik", verification:"standard" } });
    expect(options.headers.get("Idempotency-Key")).toBe("test-request");
  }
});

it("shows the public chat outage and retry action on the affected turn", () => {
  const message = "Nie udało się pobrać odpowiedzi.";
  const html = renderToStaticMarkup(createElement(TurnView, {
    item: {requestId:"synthetic", question:"Jakie są zasady?", state:"lost",
      answer:{status:"unavailable", message, claims:[], citations:[]}},
    activity:null, partialText:"", asking:false, onRetry:() => {},
  }));
  expect(html).toContain(message);
  expect(html).toContain("Ponów odpowiedź");
});
