import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { setDemoData, startDemoSession } from "@/features/auth/demo-session";
import { OLA } from "@/lib/family/ola";

const key = "przewodnik-rodzica:sesja-demo";
const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  vi.stubGlobal("window", {
    sessionStorage: {
      getItem: (item: string) => storage.get(item) ?? null,
      setItem: (item: string, value: string) => storage.set(item, value),
    },
    dispatchEvent: vi.fn(),
  });
});
afterEach(() => vi.unstubAllGlobals());

it("stores both parents, the child and the mother's insurance when the family imports its data", () => {
  startDemoSession("logowanie", "hero");
  expect(JSON.parse(storage.get(key) ?? "null").family).toEqual({ ...OLA, insuranceTitle: "Umowa o pracę" });
});

it("maps an older session to the same family and retains its original opening time", () => {
  const legacy = { version: 1, loggedInAt: "2026-11-21T12:00:00Z", origin: "logowanie", entry: "hero", method: "local", data: "local" };
  storage.set(key, JSON.stringify(legacy));
  setDemoData("local");
  expect(JSON.parse(storage.get(key) ?? "null")).toEqual({ ...legacy, family: { ...OLA, insuranceTitle: "Umowa o pracę" } });
});
