import type { ChatModelOptions } from "@/lib/zusik/chat-model";
export type ChatModelChoice = ChatModelOptions["model"];
export type ChatVerification = "standard" | "extra";
export type ChatEffort = "default" | "low" | "high";

const modelKey = "zusik.chat.model";
const effortKey = "zusik.chat.effort";
const verificationKey = "zusik.chat.verification";
const listeners = new Set<() => void>();
const memory = new Map<string, string>();

function read(key: string) {
  if (typeof window === "undefined") return null;
  if (memory.has(key)) return memory.get(key);
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  memory.set(key, value);
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // The current page keeps its choice when browser storage is unavailable.
  }
  listeners.forEach(notify => notify());
}

export function getChatModel(): ChatModelChoice {
  const selected = read(modelKey);
  return selected === "pllum" || selected === "qwen-27b" ? selected : "bielik";
}

export function setChatModel(choice: ChatModelChoice) {
  write(modelKey, choice);
}

export function getChatVerification(): ChatVerification {
  return read(verificationKey) === "extra" ? "extra" : "standard";
}

export function setChatVerification(choice: ChatVerification) {
  write(verificationKey, choice);
}

export function getChatEffort(): ChatEffort {
  const value = read(effortKey);
  return value === "low" || value === "high" ? value : "default";
}

export function setChatEffort(choice: ChatEffort) {
  write(effortKey, choice);
}

export function subscribeChatModel(notify: () => void) {
  listeners.add(notify);
  return () => { listeners.delete(notify); };
}

export function getChatModelOptions(): ChatModelOptions {
  const model = getChatModel();
  if (model !== "bielik") return { model };
  const options: ChatModelOptions = { model: "bielik", verification: getChatVerification() };
  const effort = getChatEffort();
  if (effort !== "default") options.effort = effort;
  return options;
}
