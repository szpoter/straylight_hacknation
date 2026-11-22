"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Command, KamilView } from "@/lib/kamil/contract";

/** Command without its operation key: the hook adds one per user action. */
export type Action = Command extends infer C ? (C extends { opKey: string } ? Omit<C, "opKey"> : never) : never;

export interface CaseError {
  code: string;
  message: string;
}

const MESSAGES: Record<string, string> = {
  stale_version: "Sprawa zmieniła się w innej karcie. Pokazuję aktualny stan, spróbuj jeszcze raz.",
  not_ready: "Szkic będzie gotowy, gdy potwierdzisz wszystkie dane.",
  reminder_out_of_range: "Przypomnienie musi wypaść między dzisiaj a ostatnim dniem na złożenie ZAM.",
  draft_not_reviewed: "Dane zmieniły się od zatwierdzenia podglądu. Zatwierdź podgląd ponownie.",
  no_conflict: "Ta rozbieżność została już rozstrzygnięta.",
  busy: "Zapisuję poprzednią zmianę. Spróbuj ponownie za chwilę.",
  network: "Nie udało się połączyć z serwerem. Sprawdź połączenie i spróbuj ponownie.",
  storage_unavailable: "Zapis sprawy jest chwilowo niedostępny. Spróbuj ponownie za chwilę.",
  config_missing: "Serwer demo nie ma konfiguracji bazy danych.",
};

function opKey(): string {
  return `op-${crypto.randomUUID()}`;
}

export function useKamilCase() {
  const [view, setView] = useState<KamilView | null>(null);
  const [documentCache, setDocumentCache] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<CaseError | null>(null);
  const versionRef = useRef(0);
  const lock = useRef(false);
  const [attempt, setAttempt] = useState(0);

  const accept = useCallback((next: KamilView) => {
    versionRef.current = next.version;
    setView(next);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const init = {signal: controller.signal, cache: "no-store" as const};
    async function restore() {
      try {
        const session = await fetch("/api/zusik/session", { ...init, method: "POST" });
        if (!session.ok) throw new Error("network");
        const { documentCache } = await session.json();
        if (!controller.signal.aborted) setDocumentCache(documentCache);
        const res = await fetch("/api/kamil", init);
        let body = await res.json() as {view?: KamilView; error?: string};
        if (!res.ok || !body.view) throw new Error(body.error ?? "network");
        if (body.view.version === 0) {
          const profile = await fetch("/api/kamil", {
            ...init, method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expectedVersion: 0, command: { type: "load_profile", opKey: opKey() } }),
          });
          body = await profile.json();
          if (!body.view || body.view.version === 0 || (!profile.ok && profile.status !== 409)) {
            throw new Error(body.error ?? "busy");
          }
        }
        if (!controller.signal.aborted) {
          accept(body.view);
          setError(null);
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          const code = cause instanceof Error ? cause.message : "network";
          setError({code, message: MESSAGES[code] ?? MESSAGES.network});
        }
      }
    }
    void restore();
    return () => controller.abort();
  }, [accept, attempt]);

  /** Sends one action. The same key is reused on a retry, so a repeated click changes nothing twice. */
  const send = useCallback(
    async (action: Action, key: string = opKey()): Promise<boolean> => {
      if (lock.current) return false;
      lock.current = true;
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/kamil", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ expectedVersion: versionRef.current, command: { ...action, opKey: key } }),
        });
        const body = (await res.json().catch(() => null)) as { view?: KamilView; error?: string | null } | null;
        if (body?.view) accept(body.view);
        if (res.status === 202) {
          setError({ code: "busy", message: MESSAGES.busy });
          return false;
        }
        if (!res.ok) {
          const code = body?.error ?? "network";
          setError({ code, message: MESSAGES[code] ?? MESSAGES.network });
          return false;
        }
        return true;
      } catch {
        setError({ code: "network", message: MESSAGES.network });
        return false;
      } finally {
        lock.current = false;
        setBusy(false);
      }
    },
    [accept],
  );

  return { view, documentCache, busy, error, send, reload: () => setAttempt(current => current + 1), clearError: () => setError(null) };
}
