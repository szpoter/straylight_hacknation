"use client";

import { useSyncExternalStore } from "react";
import type { FlowEntry, FlowOrigin } from "./flow";

// Sesja demo trwa do zamknięcia karty, odświeżenie nie wylogowuje (ui/NIKODEM.md, punkt 6),
// dlatego żyje w sessionStorage. Nic nie trafia na serwer: logowanie i dane są symulowane.

const STORAGE_KEY = "przewodnik-rodzica:sesja-demo";
const CHANGE_EVENT = "przewodnik-rodzica:sesja-demo-zmiana";

/** Fikcyjny profil podstawiany po „zalogowaniu” (SPEC.md, „Dane z ZUS · przykład”). */
export const DEMO_PROFILE = {
  firstName: "Anna",
  lastName: "Przykładowa",
  insurance: [
    { label: "Ubezpieczenie chorobowe", value: "aktywne" },
    { label: "Tytuł ubezpieczenia", value: "umowa o pracę" },
    { label: "Początek okresu ubezpieczenia", value: "1 marca 2025 r." },
  ],
} as const;

export type DemoSession = {
  version: 1;
  loggedInAt: string;
  method: "mobywatel";
  origin: FlowOrigin;
  entry: FlowEntry;
  /** pending: zalogowany, dane jeszcze się wczytują albo wczytanie się nie udało. */
  data: "pending" | "zus" | "manual";
};

function read(): DemoSession | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DemoSession>;
    return parsed.version === 1 ? (parsed as DemoSession) : null;
  } catch {
    return null;
  }
}

function write(session: DemoSession | null) {
  try {
    if (session) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Prywatne okno albo zablokowana pamięć: przebieg demo działa dalej, tylko bez zapamiętania.
  }
  cached = undefined;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function startDemoSession(origin: FlowOrigin, entry: FlowEntry) {
  write({ version: 1, loggedInAt: new Date().toISOString(), method: "mobywatel", origin, entry, data: "pending" });
}

export function setDemoData(data: DemoSession["data"]) {
  const current = read();
  if (current) write({ ...current, data });
}

export function endDemoSession() {
  write(null);
}

// useSyncExternalStore wymaga stabilnej migawki między odczytami.
let cached: DemoSession | null | undefined;

function getSnapshot(): DemoSession | null {
  if (cached === undefined) cached = read();
  return cached;
}

function subscribe(onChange: () => void) {
  const handle = () => {
    cached = undefined;
    onChange();
  };
  window.addEventListener(CHANGE_EVENT, handle);
  window.addEventListener("storage", handle);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handle);
    window.removeEventListener("storage", handle);
  };
}

/** undefined w czasie renderu na serwerze i pierwszego renderu w przeglądarce. */
export function useDemoSession(): DemoSession | null | undefined {
  return useSyncExternalStore(subscribe, getSnapshot, () => undefined);
}
