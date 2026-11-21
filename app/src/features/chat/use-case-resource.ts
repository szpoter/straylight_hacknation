"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** One mutation per tab. A version conflict refreshes the page from the owning session. */
export function useCaseResource<T extends { version: number }>(path: string, ready: boolean, createSession: boolean) {
  const [view, setView] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const lock = useRef(false);
  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    const init = { signal: controller.signal, cache: "no-store" as const };
    async function restore() {
      try {
        if (createSession) {
          const session = await fetch("/api/zusik/session", { ...init, method: "POST" });
          if (!session.ok) throw new Error();
        }
        const response = await fetch(path, init);
        if (!response.ok) throw new Error();
        const body = await response.json();
        if (!controller.signal.aborted) {
          setView(body.view);
          setLoaded(true);
          setError(null);
        }
      } catch {
        if (!controller.signal.aborted) setError("Nie udało się wczytać sprawy. Spróbuj ponownie.");
      }
    }
    void restore();
    return () => controller.abort();
  }, [path, ready, createSession, retryCount]);

  const send = async (action: object) => {
    if (lock.current || !loaded) return false;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(action),
        cache: "no-store",
      });
      const body = await response.json();
      if (response.status === 409) {
        if ("view" in body) setView(body.view);
        else setRetryCount((n) => n + 1);
        setError("Dane sprawy zmieniły się w innej karcie. Sprawdź aktualny stan i ponów zmianę.");
        return false;
      }
      if (!response.ok || !body.view) {
        setError(
          response.status === 400 || response.status === 422
            ? "Sprawdź daty, stawki i oświadczenia. Serwer odrzucił te dane."
            : "Nie udało się zapisać zmiany. Wczytaj sprawę ponownie, aby sprawdzić jej stan.",
        );
        return false;
      }
      setView(body.view);
      return true;
    } catch {
      setError("Połączenie zostało przerwane. Wczytaj sprawę ponownie, aby sprawdzić jej stan.");
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const reload = useCallback(() => setRetryCount((n) => n + 1), []);
  return { view, setView, busy, loaded, error, send, reload };
}
