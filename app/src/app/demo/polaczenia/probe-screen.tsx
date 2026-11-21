"use client";

import { useCallback, useEffect, useState } from "react";
import { CHOICE_LABELS, type Choice } from "@/lib/zusik/constants";
import type { CaseView } from "@/lib/zusik/types";

// Unstyled on purpose: the visual design is not ready. Behaviour only.

type Phase = "loading" | "ready" | "working" | "error";

interface ApiPayload {
  view?: CaseView;
  error?: string;
  variable?: string;
}

const short = (value: string | null, n = 8) => (value ? `…${value.slice(-n)}` : "—");

async function call(url: string, init?: RequestInit): Promise<{ status: number; body: ApiPayload }> {
  const res = await fetch(url, { cache: "no-store", ...init });
  return { status: res.status, body: (await res.json().catch(() => ({}))) as ApiPayload };
}

export function ProbeScreen() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [view, setView] = useState<CaseView | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const apply = useCallback((status: number, body: ApiPayload) => {
    if (body.view) setView(body.view);
    if (status === 409) setMessage("Sprawa zmieniła się w innej karcie. Pokazuję aktualny stan.");
    else if (status === 202) setMessage("Inne żądanie jeszcze trwa. Odśwież za chwilę.");
    else if (status >= 500)
      setMessage(
        body.error === "config_missing"
          ? `Brak konfiguracji serwera: ${body.variable}`
          : "Nie udało się zapisać ani odczytać sprawy. Spróbuj ponownie.",
      );
    else setMessage(null);
    setPhase(status >= 500 ? "error" : "ready");
  }, []);

  const load = useCallback(async () => {
    setPhase("loading");
    try {
      const session = await call("/api/zusik/session", { method: "POST" });
      if (session.status >= 400) return apply(session.status, session.body);
      const state = await call("/api/zusik/state");
      apply(state.status, state.body);
    } catch {
      apply(503, { error: "network" });
    }
  }, [apply]);

  useEffect(() => {
    // Always rebuild the screen from the server, also after closing and reopening the tab.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function post(body: object) {
    setPhase("working");
    try {
      const res = await call("/api/zusik", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      apply(res.status, res.body);
    } catch {
      apply(503, { error: "network" });
    }
  }

  const busy = phase === "loading" || phase === "working";
  const state = view?.state ?? "empty";

  return (
    <main>
      <h1>Próba połączeń Zusika</h1>

      {message && <p role="status">{message}</p>}
      {phase === "error" && (
        <button type="button" onClick={() => void load()}>
          Spróbuj ponownie
        </button>
      )}

      {state === "empty" && (
        <button type="button" disabled={busy || phase === "error"} onClick={() => void post({ action: "start" })}>
          Uruchom próbę
        </button>
      )}

      {state === "starting" && <p>Trwa uruchamianie próby…</p>}

      {state === "awaiting_choice" && view && (
        <section aria-label="Pytanie do Marty">
          <p>{view.question}</p>
          {view.choices.map((choice: Choice) => (
            <button
              key={choice}
              type="button"
              disabled={busy}
              onClick={() => void post({ action: "resume", choice, expectedCheckpointId: view.checkpointId })}
            >
              {CHOICE_LABELS[choice]}
            </button>
          ))}
        </section>
      )}

      {state === "completed" && view?.choice && (
        <p>
          <strong>Wybrano {view.choice}</strong>
        </p>
      )}

      {phase === "working" && <p>Zapisywanie…</p>}

      <details open>
        <summary>Dla testera</summary>
        <dl>
          <dt>Stan</dt>
          <dd data-testid="state">{state}</dd>
          <dt>Sprawa (wątek)</dt>
          <dd data-testid="thread">{short(view?.threadId ?? null, 10)}</dd>
          <dt>Znacznik próby</dt>
          <dd data-testid="probe">{short(view?.probeId ?? null)}</dd>
          <dt>Źródło</dt>
          <dd data-testid="source">{view?.sourceId ?? (state === "empty" ? "—" : "brak źródła")}</dd>
          <dt>Model</dt>
          <dd>{view?.model ?? "—"}</dd>
          <dt>Dostawcy</dt>
          <dd data-testid="providers">
            Qdrant: {view?.providers.qdrant ?? "—"} · Sherlock: {view?.providers.sherlock ?? "—"}
          </dd>
          <dt>Checkpoint</dt>
          <dd data-testid="checkpoint">{short(view?.checkpointId ?? null)}</dd>
          <dt>Oczekujące przerwanie</dt>
          <dd data-testid="interrupt">{short(view?.interruptId ?? null)}</dd>
        </dl>
      </details>
    </main>
  );
}
