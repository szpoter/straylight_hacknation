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
  not_ready: "Szkic będzie gotowy, gdy wszystkie dane zostaną potwierdzone.",
  reminder_out_of_range: "Przypomnienie musi wypaść między dzisiaj a ostatnim dniem na złożenie.",
  draft_not_reviewed: "Dane zmieniły się od zatwierdzenia podglądu. Zatwierdź podgląd ponownie.",
  no_conflict: "Ta rozbieżność została już rozstrzygnięta.",
  busy: "Zapisuję poprzednią zmianę, za chwilę spróbuj ponownie.",
  network: "Nie udało się połączyć z serwerem. Sprawdź połączenie i spróbuj ponownie.",
  storage_unavailable: "Zapis sprawy jest chwilowo niedostępny. Spróbuj ponownie za chwilę.",
  config_missing: "Serwer demo nie ma konfiguracji bazy danych.",
};

function opKey(): string {
  return `op-${crypto.randomUUID()}`;
}

export function useKamilCase() {
  const [view, setView] = useState<KamilView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<CaseError | null>(null);
  const versionRef = useRef(0);

  const accept = useCallback((next: KamilView) => {
    versionRef.current = next.version;
    setView(next);
  }, []);

  const load = useCallback(async () => {
    const res = await fetch("/api/kamil", { cache: "no-store" });
    const body = (await res.json().catch(() => null)) as { view?: KamilView; error?: string } | null;
    if (body?.view) accept(body.view);
    else {
      const code = body?.error ?? "network";
      setError({ code, message: MESSAGES[code] ?? MESSAGES.network });
    }
    return body?.view ?? null;
  }, [accept]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Reuses the signed demo session cookie of Zusik (HttpOnly). Idempotent.
      await fetch("/api/zusik/session", { method: "POST" }).catch(() => null);
      if (cancelled) return;
      const loaded = await load().catch(() => null);
      if (!cancelled && loaded && loaded.version === 0) {
        // First visit: the fictional profile fills Kamil's data, the payer and the mother's PESEL.
        const res = await fetch("/api/kamil", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ expectedVersion: 0, command: { type: "load_profile", opKey: opKey() } }),
        });
        const body = (await res.json().catch(() => null)) as { view?: KamilView } | null;
        if (!cancelled && body?.view) accept(body.view);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accept, load]);

  /** Sends one action. The same key is reused on a retry, so a repeated click changes nothing twice. */
  const send = useCallback(
    async (action: Action, key: string = opKey()): Promise<boolean> => {
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
        setBusy(false);
      }
    },
    [accept],
  );

  return { view, busy, error, send, reload: load, clearError: () => setError(null) };
}
